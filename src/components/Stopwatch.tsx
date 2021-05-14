import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BLOCK_REF_REGEX,
  extractTag,
  getPageTitleByBlockUid,
  getPageUidByPageTitle,
  getRoamUrlByPage,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  updateBlock,
} from "roam-client";
import {
  createComponentRender,
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
  renderWarningToast,
} from "roamjs-components";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import { Card } from "@blueprintjs/core";
import { getPlayerName, isPageRelayGame } from "../util/helpers";

const Stopwatch = ({ blockUid }: { blockUid: string }) => {
  const page = useMemo(() => getPageTitleByBlockUid(blockUid), [blockUid]);
  const pageUid = useMemo(() => getPageUidByPageTitle(page), [page]);
  const isGame = useMemo(() => isPageRelayGame(pageUid), [pageUid]);
  if (!isGame) {
    return (
      <span>
        Stopwatch could only be rendered on a Relay Game instance page.
      </span>
    );
  }
  const tree = useMemo(() => getTreeByPageName(page), [page]);
  const isActive = useMemo(
    () =>
      getSettingValueFromTree({
        tree,
        key: "State",
      }) === "ACTIVE",
    [tree]
  );
  if (!isActive) {
    return <span>Stopwatch only runs on active games.</span>;
  }
  const startTime = useMemo(
    () =>
      new Date(
        getSettingValueFromTree({
          tree,
          key: "Start time",
        })
      ),
    [tree]
  );
  const currentPlayerUid = useMemo(
    () =>
      (tree.find((t) => /current player/i.test(t.text))?.children || [])?.[0]
        ?.uid,
    []
  );
  const launchUid = useMemo(
    () =>
      getSettingValueFromTree({ tree, key: "Launched From" }).match(
        new RegExp(BLOCK_REF_REGEX.source)
      )?.[1],
    [tree]
  );
  const launchTree = useMemo(
    () => getTreeByBlockUid(launchUid).children || [],
    [launchUid]
  );
  const players = useMemo(
    () =>
      getSettingValuesFromTree({
        tree: launchTree,
        key: "Players",
      }),
    [launchTree]
  );
  const timeLimit = useMemo(
    () =>
      getSettingIntFromTree({
        tree: launchTree,
        key: "Time",
        defaultValue: 10,
      }),
    [launchTree]
  );
  const [timeElapsed, setTimeElapsed] = useState(
    differenceInMilliseconds(new Date(), startTime)
  );
  const timeoutRef = useRef(0);
  const timeoutCallback = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      setTimeElapsed(differenceInMilliseconds(new Date(), startTime));
      timeoutCallback();
    }, 100);
  }, [timeoutRef]);
  useEffect(() => {
    timeoutCallback();
    return () => clearTimeout(timeoutRef.current);
  }, [timeoutRef, timeoutCallback]);
  const millis = timeElapsed % 1000;
  const seconds = Math.floor(timeElapsed / 1000) % 60;
  const minutes = Math.floor(timeElapsed / 60000);
  useEffect(() => {
    const currentPlayer = extractTag(getTextByBlockUid(currentPlayerUid));
    const newCurrentPlayer =
      players[Math.floor(minutes / timeLimit) % players.length];
    if (newCurrentPlayer !== currentPlayer) {
      updateBlock({ uid: currentPlayerUid, text: `[[${newCurrentPlayer}]]` });
      const thisUser = getPlayerName();
      if (thisUser !== currentPlayer) {
        window.location.assign(
          getRoamUrlByPage(getPageTitleByBlockUid(launchUid))
        );
        renderWarningToast({
          id: "deny-game",
          content: `Time's up! It's now ${newCurrentPlayer}'s turn to solve the problem!`,
        });
      }
    }
  }, [timeLimit, minutes]);
  return (
    <Card>
      <h3>Timer</h3>
      <span>
        {`${minutes}`.padStart(2, "0")}:{`${seconds}`.padStart(2, "0")}.{millis}
      </span>
    </Card>
  );
};

export const render = createComponentRender(Stopwatch);

export default Stopwatch;
