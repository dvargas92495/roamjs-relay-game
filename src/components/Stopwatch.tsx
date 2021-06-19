import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BLOCK_REF_REGEX,
  createBlock,
  createPage,
  extractTag,
  getCurrentPageUid,
  getPageTitleByBlockUid,
  getPageUidByPageTitle,
  getRoamUrl,
  getShallowTreeByParentUid,
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
  toFlexRegex,
} from "roamjs-components";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import { Card } from "@blueprintjs/core";
import {
  getPlayerName,
  HIDE_CLASSNAME,
  isPageRelayGame,
} from "../util/helpers";

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
      (tree.find((t) => toFlexRegex("current player").test(t.text))?.children ||
        [])?.[0]?.uid,
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
  const millis = 1000 - (timeElapsed % 1000);
  const seconds = 60 - (Math.ceil(timeElapsed / 1000) % 60);
  const minutes = timeLimit - Math.ceil(timeElapsed / 60000);
  const timesUp = timeElapsed >= timeLimit * 1000 * 60;
  useEffect(() => {
    if (timesUp && getCurrentPageUid() === pageUid) {
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
              {
                text: `Version Control #${HIDE_CLASSNAME}`,
              },
            ],
          });
        setTimeout(() => {
          window.location.assign(getRoamUrl(postGameUid));
          setTimeout(() => {
            const vcUid = getShallowTreeByParentUid(postGameUid).find((t) =>
              toFlexRegex("Version Control").test(t.text)
            )?.uid;
            const notesUid = tree.find((t) =>
              toFlexRegex("notes").test(t.text)
            )?.uid;
            if (vcUid && notesUid) {
              const node = getTreeByBlockUid(notesUid);
              node.text = thisUser;
              createBlock({
                parentUid: vcUid,
                node,
              });
            }
          }, 1);
        }, 50);
        renderWarningToast({
          id: "deny-game",
          content: `Time's up! It's now someone else's turn to solve the problem!`,
        });
      }
    }
  }, [timesUp, pageUid]);
  return (
    <Card style={{ padding: 4, width: "fit-content" }}>
      <h3>Timer</h3>
      <span>
        {timesUp ? "00" : `${minutes}`.padStart(2, "0")}:
        {timesUp || seconds === 60 ? "00" : `${seconds}`.padStart(2, "0")}.
        {timesUp || millis === 1000 ? "000" : millis}
      </span>
    </Card>
  );
};

export const render = createComponentRender(Stopwatch);

export default Stopwatch;
