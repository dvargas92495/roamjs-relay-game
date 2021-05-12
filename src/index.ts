import {
  createButtonObserver,
  createBlock,
  createPage,
  getBlockUidAndTextIncludingText,
  getCurrentUserEmail,
  getLinkedPageTitlesUnderUid,
  getShallowTreeByParentUid,
  getPageUidByPageTitle,
  getTreeByBlockUid,
  getDisplayNameByEmail,
  getRoamUrl,
  getPageTitleByPageUid,
  extractTag,
} from "roam-client";
import { render } from "./components/RelayGameButton";
import { render as gameDialogRender } from "./components/CreateGameDialog";
import { render as playerAlertRender } from "./components/CreatePlayerAlert";
import { getSettingValueFromTree, renderWarningToast } from "roamjs-components";

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

window.addEventListener("hashchange", (e) => {
  const { newURL } = e;
  const urlUid = newURL.match(/\/page\/(.*)$/)?.[1];
  if (urlUid) {
    const links = getLinkedPageTitlesUnderUid(urlUid);
    const isRelayGame = links.some((link) =>
      getLinkedPageTitlesUnderUid(getPageUidByPageTitle(link)).some(
        (s) => s === "Relay Game"
      )
    );
    if (isRelayGame) {
      const tree = getTreeByBlockUid(urlUid).children;
      const displayName = getDisplayNameByEmail(userEmail) || userEmail;
      const isCurrentPlayer =
        extractTag(
          getSettingValueFromTree({
            tree,
            key: "Current Player",
          })
        ) === displayName;
      const isActive =
        getSettingValueFromTree({
          tree,
          key: "state",
        }) === "ACTIVE";
      if (isActive && !isCurrentPlayer) {
        window.location.assign(getRoamUrl());
        renderWarningToast({
          id: "deny-game",
          content: `Not allowed to access Relay Game ${getPageTitleByPageUid(
            urlUid
          )} while the game is active and you're not the current player.`,
        });
      }
    }
  }
});
