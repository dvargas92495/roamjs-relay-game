import { Button, Intent } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  extractTag,
  getFirstChildTextByBlockUid,
  getPageUidByPageTitle,
  getRoamUrl,
  getShallowTreeByParentUid,
  PullBlock,
} from "roam-client";
import { addInputSetting, setInputSetting } from "roamjs-components";
import { getPlayerName } from "../util/helpers";

const JoinGameButton = ({ name }: { name: string }) => {
  const displayName = useMemo(getPlayerName, []);
  const pageUid = useMemo(() => getPageUidByPageTitle(name), [name]);
  const shallowTree = useMemo(
    () => getShallowTreeByParentUid(pageUid),
    [pageUid]
  );
  const playersUid = useMemo(
    () => shallowTree.find((t) => /players/i.test(t.text))?.uid,
    [shallowTree]
  );
  const players = useMemo(
    () => getShallowTreeByParentUid(playersUid).map(({ text }) => text),
    [playersUid]
  );
  const [playerLength, setPlayerLength] = useState(players.length);
  const [joinedIndex, setJoinedIndex] = useState(players.map(extractTag).indexOf(displayName));
  const currentPlayerUid = useMemo(
    () => shallowTree.find((t) => /current player/i.test(t.text))?.uid,
    [shallowTree]
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(
    Number(getFirstChildTextByBlockUid(currentPlayerUid))
  );
  useEffect(() => {
    const callback = (_: PullBlock, a: PullBlock) =>
      a && setCurrentPlayerIndex(Number(a[":block/string"]));
    const playersCallback = (_: PullBlock, a: PullBlock) =>
      a && setPlayerLength(a[":block/children"].length);
    window.roamAlphaAPI.data.addPullWatch(
      "[:block/string]",
      `[:block/uid "${currentPlayerUid}"]`,
      callback
    );
    window.roamAlphaAPI.data.addPullWatch(
      "[:block/children]",
      `[:block/uid "${playersUid}"]`,
      playersCallback
    );
    return () => {
      window.roamAlphaAPI.data.removePullWatch(
        "[:block/string]",
        `[:block/uid "${currentPlayerUid}"]`,
        callback
      );
      window.roamAlphaAPI.data.removePullWatch(
        "[:block/children]",
        `[:block/uid "${playersUid}"]`,
        playersCallback
      );
    };
  }, [setCurrentPlayerIndex, setPlayerLength, playersUid, currentPlayerUid]);
  return joinedIndex === currentPlayerIndex ? (
    <Button
      text={"Play"}
      intent={Intent.SUCCESS}
      onClick={() => window.location.assign(getRoamUrl(pageUid))}
    />
  ) : joinedIndex < 0 ? (
    <Button
      text={"Join"}
      intent={Intent.PRIMARY}
      onClick={() => {
        setJoinedIndex(playerLength);
        addInputSetting({
          blockUid: pageUid,
          key: "players",
          value: `[[${displayName}]]`,
        });
        if (playerLength === currentPlayerIndex) {
          setInputSetting({
            blockUid: pageUid,
            key: "{{stopwatch}}",
            value: new Date().toISOString(),
          });
          window.location.assign(getRoamUrl(pageUid));
        }
      }}
    />
  ) : (
    <Button text={"Finished"} intent={Intent.WARNING} disabled={true} />
  );
};

export const render = ({ p, name }: { p: HTMLElement; name: string }) => {
  window.addEventListener(
    "hashchange",
    () => ReactDOM.unmountComponentAtNode(p),
    { once: true }
  );
  ReactDOM.render(<JoinGameButton name={name} />, p);
};

export default JoinGameButton;
