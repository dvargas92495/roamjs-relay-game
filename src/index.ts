import {
  createButtonObserver,
  createBlock,
  createPage,
  getBlockUidAndTextIncludingText,
  getCurrentUserEmail,
  getShallowTreeByParentUid,
  getPageUidByPageTitle,
} from "roam-client";
import { render } from "./components/RelayGameButton";
import { render as gameDialogRender } from "./components/CreateGameDialog";
import { render as playerAlertRender } from "./components/CreatePlayerAlert";

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
  attribute: "relay game",
  render,
});

window.roamAlphaAPI.ui.commandPalette.addCommand({
  label: "Create Relay Game",
  callback: () => gameDialogRender({}),
});

const userEmail = getCurrentUserEmail();
const blocksWithEmail = getBlockUidAndTextIncludingText(
  userEmail
).filter(({ text }) => /^Email::/.test(text));
if (!blocksWithEmail.length) {
  playerAlertRender({email: userEmail});
}
