import React, { useMemo, useState } from "react";
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
  getPageTitleReferencesByPageTitle,
  getPageTitlesReferencingBlockUid,
  getPageUidByPageTitle,
  getTreeByBlockUid,
  getTreeByPageName,
} from "roam-client";
import axios from "axios";
import JoinGameButton from "./JoinGameButton";
import { HOME } from "../util/helpers";

type GameState = "ACTIVE" | "NONE" | "COMPLETE";

const RelayGameButton = ({ blockUid }: { blockUid: string }) => {
  const tree = getTreeByBlockUid(blockUid).children;
  const [gameLabel, setGameLabel] = useState(
    getSettingValueFromTree({ tree, key: "label" })
  );
  const items = useMemo(
    () => getPageTitleReferencesByPageTitle(HOME),
    []
  );
  const [activeGame, setActiveGame] = useState(
    getSettingValueFromTree({ tree, key: "game", defaultValue: items[0] })
  );
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [timeLimit, setTimeLimit] = useState(
    getSettingIntFromTree({ tree, key: "time", defaultValue: 10 })
  );
  const liveTree = useMemo(
    () =>
      getPageTitlesReferencingBlockUid(blockUid).some(
        (title) => title === gameLabel
      )
        ? getTreeByPageName(gameLabel)
        : [],
    [gameLabel, blockUid]
  );
  const [state, setState] = useState<GameState>(
    getSettingValueFromTree({
      tree: liveTree,
      key: "state",
      defaultValue: "NONE",
    }) as GameState
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
        style={{ cursor: "pointer", color: "darkblue", userSelect: "none" }}
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
        <div>{state === "ACTIVE" && <JoinGameButton name={gameLabel} />}</div>
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
                            `Add a source to this ${HOME} to populate the problem`
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
                        text: "Players",
                      },
                      {
                        text: "Current Player",
                        children: [
                          {
                            text: "0",
                          },
                        ],
                      },
                      {
                        text: "{{stopwatch}}",
                        children: [{ text: new Date().toISOString() }],
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
                  setTimeout(() => {
                    setState("ACTIVE");
                    setLoading(false);
                  }, 50);
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
