import {
  createButtonObserver,
  createBlock,
  createPage,
  getBlockUidAndTextIncludingText,
  getCurrentUserEmail,
  getShallowTreeByParentUid,
  getPageUidByPageTitle,
  getTreeByBlockUid,
  getDisplayNameByEmail,
  getRoamUrl,
  getPageTitleByPageUid,
  extractTag,
  getUids,
} from "roam-client";
import { render } from "./components/RelayGameButton";
import { render as gameDialogRender } from "./components/CreateGameDialog";
import { render as playerAlertRender } from "./components/CreatePlayerAlert";
import { render as stopWatchRender } from "./components/Stopwatch";
import { render as joinGameRender } from "./components/JoinGameButton";
import {
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
  renderWarningToast,
} from "roamjs-components";
import { getPlayerName, isPageRelayGame } from "./util/helpers";

const lobbyUid =
  getPageUidByPageTitle("Lobby") || createPage({ title: "Lobby" });
setTimeout(() => {
  const tree = getShallowTreeByParentUid(lobbyUid);
  const existingText = new Set(tree.map((t) => t.text));
  const queries = [
    `{{[[query]]: {and: [[Relay Game]] [[Active]]}}}`,
    `{{[[query]]: {and: [[Relay Game]] [[Inactive]]}}}`,
  ];
  queries
    .filter((q) => existingText.has(q))
    .forEach((text, order) =>
      createBlock({ node: { text }, order, parentUid: lobbyUid })
    );
});

createButtonObserver({
  shortcut: "relay",
  attribute: "relay-game",
  render,
});

createButtonObserver({
  shortcut: "stopwatch",
  attribute: "relay-stopwatch",
  render: stopWatchRender,
});

window.roamAlphaAPI.ui.commandPalette.addCommand({
  label: "Create Relay Game",
  callback: () => gameDialogRender({}),
});

const userEmail = getCurrentUserEmail();
const blocksWithEmail = getBlockUidAndTextIncludingText(userEmail).filter(
  ({ text }) => /^Email::/.test(text)
);
if (!blocksWithEmail.length) {
  playerAlertRender({ email: userEmail });
}

const hiddenMetadata = ["players", "current player", "launched from", "state"];

window.addEventListener("hashchange", (e) => {
  const { newURL } = e;
  const urlUid = newURL.match(/\/page\/(.*)$/)?.[1];
  if (urlUid) {
    if (isPageRelayGame(urlUid)) {
      const tree = getTreeByBlockUid(urlUid).children;
      const displayName = getPlayerName();
      const currentPlayer =
        getSettingValuesFromTree({ tree, key: "players" })[
          getSettingIntFromTree({
            tree,
            key: "Current Player",
          })
        ] || "";
      const isCurrentPlayer = extractTag(currentPlayer) === displayName;
      const isActive =
        getSettingValueFromTree({
          tree,
          key: "state",
        }) === "ACTIVE";
      if (isActive) {
        if (!isCurrentPlayer) {
          window.location.assign(getRoamUrl());
          renderWarningToast({
            id: "deny-game",
            content: `Not allowed to access Relay Game ${getPageTitleByPageUid(
              urlUid
            )} while the game is active and you're not the current player.`,
          });
        } else {
          const hideUids = new Set(
            tree
              .filter((t) =>
                hiddenMetadata.some((md) => new RegExp(md, "i").test(t.text))
              )
              .map(({ uid }) => uid)
          );
          Array.from(document.getElementsByClassName("roam-block"))
            .map((d) => d as HTMLDivElement)
            .filter((d) => hideUids.has(getUids(d).blockUid))
            .map((d) => d.closest(".roam-block-container") as HTMLDivElement)
            .filter((d) => !!d)
            .forEach((d) => (d.style.display = "none"));
        }
      }
    } else if (
      getShallowTreeByParentUid(urlUid).some(
        (t) => t.text === "#[[Relay Game]]"
      )
    ) {
      Array.from(
        document.getElementsByClassName("rm-title-arrow-wrapper")
      ).forEach((d) => {
        const parent = document.createElement("div");
        d.appendChild(parent);
        parent.style.marginRight = "32px";
        joinGameRender({
          p: parent,
          name: d.querySelector(".rm-page__title").innerHTML,
        });
      });
    }
  }
});
