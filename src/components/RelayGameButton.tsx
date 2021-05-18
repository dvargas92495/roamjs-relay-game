import React, { Children, useMemo, useState } from "react";
import {
  Card,
  Button,
  Label,
  Icon,
  InputGroup,
  NumericInput,
  Spinner,
  SpinnerSize,
  Intent,
} from "@blueprintjs/core";
import {
  addInputSetting,
  createComponentRender,
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
  MenuItemSelect,
  setInputSetting,
} from "roamjs-components";
import {
  createBlock,
  createPage,
  deleteBlock,
  extractTag,
  getFirstChildUidByBlockUid,
  getPageTitleReferencesByPageTitle,
  getPageTitlesReferencingBlockUid,
  getPageUidByPageTitle,
  getRoamUrl,
  getShallowTreeByParentUid,
  getTextByBlockUid,
  getTreeByBlockUid,
  getTreeByPageName,
  updateBlock,
} from "roam-client";
import axios from "axios";
import { getPlayerName } from "../util/helpers";

type GameState = "ACTIVE" | "NONE" | "COMPLETE";

const RelayGameButton = ({ blockUid }: { blockUid: string }) => {
  const displayName = useMemo(getPlayerName, []);
  const tree = getTreeByBlockUid(blockUid).children;
  const [gameLabel, setGameLabel] = useState(
    getSettingValueFromTree({ tree, key: "label" })
  );
  const items = useMemo(
    () => getPageTitleReferencesByPageTitle("Relay Game"),
    []
  );
  const [activeGame, setActiveGame] = useState(
    getSettingValueFromTree({ tree, key: "game", defaultValue: items[0] })
  );
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [timeLimit, setTimeLimit] = useState(
    getSettingIntFromTree({ tree, key: "time", defaultValue: 10 })
  );
  const [state, setState] = useState<GameState>(
    getPageTitlesReferencingBlockUid(blockUid).some(
      (title) => title === gameLabel
    )
      ? (getSettingValueFromTree({
          tree: getTreeByPageName(gameLabel),
          key: "state",
        }) as GameState)
      : "NONE"
  );
  const [hasJoined, setHasJoined] = useState(
    (tree.find((t) => /players/i.test(t.text))?.children || []).some(
      (s) => extractTag(s.text) === displayName
    )
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const parameters = useMemo(
    () =>
      getSettingValuesFromTree({
        tree: getTreeByPageName(activeGame),
        key: "parameters",
      }),
    [activeGame]
  );
  const [parameterMap, setParameterMap] = useState<Record<string, string>>(
    Object.fromEntries(
      (tree.find((t) => /parameters/i.test(t.text))?.children || []).map(
        (t) => [t.text, t.children[0]?.text || ""]
      )
    )
  );
  return (
    <Card>
      <Label>
        Game Instance Label
        <InputGroup
          value={gameLabel}
          disabled={state === "ACTIVE"}
          onChange={(e) => {
            setError("");
            const value = (e.target as HTMLInputElement).value;
            setGameLabel(value);
            setInputSetting({ blockUid, value, key: "label" });
          }}
        />
      </Label>
      <Label>
        Game
        <MenuItemSelect
          disabled={state === "ACTIVE"}
          activeItem={activeGame}
          items={items}
          onItemSelect={(value) => {
            setActiveGame(value);
            setInputSetting({ blockUid, value, key: "game", index: 1 });
          }}
          ButtonProps={{ disabled: state === "ACTIVE" }}
        />
      </Label>
      {!!parameters.length && (
        <Label>
          Game Parameters{" "}
          <div>
            {parameters.map((p, i) => (
              <InputGroup
                key={p}
                placeholder={p}
                value={parameterMap[p] || ""}
                disabled={state === "ACTIVE"}
                onChange={(e) => {
                  const parentUid =
                    getTreeByBlockUid(blockUid).children.find((t) =>
                      /parameters/i.test(t.text)
                    )?.uid ||
                    createBlock({
                      node: { text: "Parameters" },
                      parentUid: blockUid,
                      order: 2,
                    });
                  const value = (e.target as HTMLInputElement).value;
                  setParameterMap({ ...parameterMap, [p]: value });
                  setTimeout(() =>
                    setInputSetting({
                      blockUid: parentUid,
                      value,
                      key: p,
                      index: i,
                    })
                  );
                }}
              />
            ))}
          </div>
        </Label>
      )}
      <div
        onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
        style={{ cursor: "pointer", color: "darkblue" }}
      >
        <Icon icon={showAdditionalOptions ? "caret-down" : "caret-right"} />{" "}
        {showAdditionalOptions ? "Hide" : "Show"} Additional Options
      </div>
      {showAdditionalOptions && (
        <div>
          <Label>
            Time Limit Per Player (minutes)
            <NumericInput
              disabled={state === "ACTIVE"}
              value={timeLimit}
              onValueChange={(n, value) => {
                setTimeLimit(n);
                setInputSetting({ blockUid, value, key: "time" });
              }}
              min={1}
            />
          </Label>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Button
          text={"Join"}
          disabled={hasJoined}
          onClick={() => {
            setHasJoined(true);
            addInputSetting({
              blockUid,
              value: `[[${displayName}]]`,
              key: "Players",
            });
            const gameLabelUid = getPageUidByPageTitle(gameLabel);
            const gameTree = getShallowTreeByParentUid(gameLabelUid);
            const currentPlayerUid = gameTree.find((t) =>
              /current player/i.test(t.text)
            )?.uid;
            if (currentPlayerUid) {
              const childUid = getFirstChildUidByBlockUid(currentPlayerUid);
              if (childUid && !getTextByBlockUid(childUid)) {
                updateBlock({
                  text: `[[${displayName}]]`,
                  uid: childUid,
                });
                const timeUid = gameTree.find((t) =>
                  /{{stopwatch}}/i.test(t.text)
                )?.uid;
                updateBlock({
                  text: new Date().toISOString(),
                  uid: getFirstChildUidByBlockUid(timeUid),
                });
                window.location.assign(getRoamUrl(gameLabelUid));
              }
            }
          }}
          intent={Intent.SUCCESS}
        />
        <div style={{ display: "flex" }}>
          {loading && <Spinner size={SpinnerSize.SMALL} />}
          <Button
            text={"Create Game"}
            disabled={!gameLabel || state === "ACTIVE" || loading}
            intent={Intent.PRIMARY}
            style={{ marginLeft: 16 }}
            onClick={() => {
              if (getPageUidByPageTitle(gameLabel)) {
                setError(
                  `There already exists a page with ${gameLabel}. Please pick a different label.`
                );
                return;
              }
              setLoading(true);
              setTimeout(() => {
                const gameTree = getTreeByPageName(activeGame);
                const source = getSettingValueFromTree({
                  tree: gameTree,
                  key: "Source",
                });
                (source
                  ? axios
                      .get(
                        parameters.reduce(
                          (prev, cur) =>
                            prev.replace(
                              new RegExp(`{${cur.toLowerCase()}}`),
                              parameterMap[cur]
                            ),
                          source
                        )
                      )
                      .then(
                        (r) => r.data.problem || ("No Problem Found" as string)
                      )
                  : new Promise((resolve) =>
                      setTimeout(
                        () =>
                          resolve(
                            "Add a source to this relay game to populate the problem"
                          ),
                        500
                      )
                    )
                ).then((problem) => {
                  createPage({
                    title: gameLabel,
                    tree: [
                      {
                        text: `#[[${activeGame}]]`,
                      },
                      {
                        text: "Launched From",
                        children: [
                          {
                            text: `((${blockUid}))`,
                          },
                        ],
                      },
                      {
                        text: "State",
                        children: [{ text: "ACTIVE" }],
                      },
                      {
                        text: "Current Player",
                        children: [
                          {
                            text: "",
                          },
                        ],
                      },
                      {
                        text: "Problem",
                        children: [
                          {
                            text: problem,
                          },
                        ],
                      },
                      {
                        text: "{{stopwatch}}",
                        children: [{ text: new Date().toISOString() }],
                      },
                      {
                        text: "Notes",
                        children: [
                          {
                            text: "Start work here...",
                          },
                        ],
                      },
                      {
                        text: "Answer",
                        children: [
                          {
                            text: "Add answer here...",
                          },
                        ],
                      },
                    ],
                  });
                  setState("ACTIVE");
                  setLoading(false);
                });
              }, 1);
            }}
          />
        </div>
      </div>
      <span style={{ color: "darkred" }}>{error}</span>
    </Card>
  );
};

export const render = createComponentRender(RelayGameButton);

export default RelayGameButton;
