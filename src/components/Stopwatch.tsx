import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BLOCK_REF_REGEX,
  createPage,
  extractTag,
  getPageTitleByBlockUid,
  getPageUidByPageTitle,
  getRoamUrl,
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
          key: "{{stopwatch}}",
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
        tree,
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
    if (minutes >= timeLimit) {
      const currentPlayerIndex = Number(getTextByBlockUid(currentPlayerUid));
      const newCurrentPlayer = extractTag(
        players[currentPlayerIndex + 1] || ""
      );
      if (currentPlayerIndex < players.length) {
        updateBlock({
          uid: currentPlayerUid,
          text: `${currentPlayerIndex + 1}`,
        });
      }
      const thisUser = getPlayerName();
      if (thisUser !== newCurrentPlayer) {
        const postGameTitle = `Post Game/${page}`;
        const postGameUid =
          getPageUidByPageTitle(postGameTitle) ||
          createPage({
            title: postGameTitle,
            tree: [
              {
                text: `Welcome to the Post Game discussion board for [[${page}]]. Use the space below to discuss strategies that would have been helpful for solving the game.`,
              },
            ],
          });
        setTimeout(() => {
          window.location.assign(
            getRoamUrl(postGameUid)
          );
        }, 50);
        renderWarningToast({
          id: "deny-game",
          content: `Time's up! It's now someone else's turn to solve the problem!`,
        });
      }
    }
  }, [timeLimit, minutes]);
  return (
    <Card style={{ padding: 4, width: "fit-content" }}>
      <h3>Timer</h3>
      <span>
        {`${minutes}`.padStart(2, "0")}:{`${seconds}`.padStart(2, "0")}.{millis}
      </span>
    </Card>
  );
};

export const render = createComponentRender(Stopwatch);

export default Stopwatch;
