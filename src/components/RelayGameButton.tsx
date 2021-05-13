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
  MenuItemSelect,
  setInputSetting,
} from "roamjs-components";
import {
  createPage,
  deleteBlock,
  extractTag,
  getCurrentUserEmail,
  getDisplayNameByEmail,
  getPageTitleReferencesByPageTitle,
  getPageTitlesReferencingBlockUid,
  getPageUidByPageTitle,
  getRoamUrl,
  getTreeByBlockUid,
  getTreeByPageName,
} from "roam-client";
import axios from "axios";

type GameState = "ACTIVE" | "NONE" | "COMPLETE";

const RelayGameButton = ({ blockUid }: { blockUid: string }) => {
  const email = getCurrentUserEmail();
  const displayName = getDisplayNameByEmail(email) || email;
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
  const state: GameState = getPageTitlesReferencingBlockUid(blockUid).some(
    (title) => title === gameLabel
  )
    ? (getSettingValueFromTree({
        tree: getTreeByPageName(gameLabel),
        key: "state",
      }) as GameState)
    : "NONE";
  const [joinedUid, setJoinedUid] = useState(
    (tree.find((t) => /players/i.test(t.text))?.children || []).find(
      (s) => extractTag(s.text) === displayName
    )?.uid
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
            setInputSetting({ blockUid, value, key: "game" });
          }}
        />
      </Label>
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
        {joinedUid ? (
          <Button
            text={"Leave"}
            onClick={() => {
              deleteBlock(joinedUid);
              setJoinedUid("");
            }}
            intent={Intent.DANGER}
          />
        ) : (
          <Button
            text={"Join"}
            onClick={() => {
              setJoinedUid(
                addInputSetting({
                  blockUid,
                  value: `[[${displayName}]]`,
                  key: "players",
                })
              );
            }}
            intent={Intent.SUCCESS}
          />
        )}
        <div style={{ display: "flex" }}>
          {loading && <Spinner size={SpinnerSize.SMALL} />}
          <Button
            text={"Start Game"}
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
                if (!joinedUid) {
                  setJoinedUid(
                    addInputSetting({
                      blockUid,
                      value: `[[${displayName}]]`,
                      key: "players",
                    })
                  );
                }
                const gameTree = getTreeByPageName(activeGame);
                const source = getSettingValueFromTree({
                  tree: gameTree,
                  key: "Source",
                });
                (source
                  ? axios.get(source).then((r) => r.data.project as string)
                  : Promise.resolve(
                      "Add a source to this relay game to populate the problem"
                    )
                ).then((problem) => {
                  const pageUid = createPage({
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
                        text: "Start Time",
                        children: [{ text: new Date().toISOString() }],
                      },
                      {
                        text: "Current Player",
                        children: [
                          {
                            text: `[[${displayName}]]`,
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
                        text: "Timer",
                        children: [{ text: "{{timer}}" }],
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
                    window.location.assign(getRoamUrl(pageUid));
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
