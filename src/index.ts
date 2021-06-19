import {
  createButtonObserver,
  createBlock,
  createPage,
  getBlockUidAndTextIncludingText,
  getCurrentUserEmail,
  getShallowTreeByParentUid,
  getPageUidByPageTitle,
  getTreeByBlockUid,
  getRoamUrl,
  getPageTitleByPageUid,
  extractTag,
  addStyle,
  getLinkedPageTitlesUnderUid,
} from "roam-client";
import { render } from "./components/RelayGameButton";
import { render as gameDialogRender } from "./components/CreateGameDialog";
import { render as playerAlertRender } from "./components/CreatePlayerAlert";
import { render as stopWatchRender } from "./components/Stopwatch";
import { render as joinGameRender } from "./components/JoinGameButton";
import { render as postGameRender } from "./components/PostGameButton";
import {
  getSettingIntFromTree,
  getSettingValueFromTree,
  getSettingValuesFromTree,
  renderWarningToast,
} from "roamjs-components";
import {
  getPlayerName,
  HIDE_CLASSNAME,
  HOME,
  isPageRelayGame,
} from "./util/helpers";

addStyle(`${HIDE_CLASSNAME} {
  display: none;
}`);

const lobbyUid =
  getPageUidByPageTitle("Lobby") || createPage({ title: "Lobby" });
setTimeout(() => {
  const tree = getShallowTreeByParentUid(lobbyUid);
  const existingText = new Set(tree.map((t) => t.text));
  const queries = [
    `{{[[query]]: {and: [[${HOME}]] [[Active]]}}}`,
    `{{[[query]]: {and: [[${HOME}]] [[Inactive]]}}}`,
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

const redirectHome = () => {
  const uid = getPageUidByPageTitle(HOME);
  if (uid) {
    window.location.assign(getRoamUrl(uid));
  }
};

const POST_GAME_REGEX = /^Post Game\/(.*)$/;
const getPostGameType = (uid: string) => {
  const gameTitle = POST_GAME_REGEX.exec(getPageTitleByPageUid(uid))?.[1];
  if (gameTitle) {
    const titleUid = getPageUidByPageTitle(gameTitle);
    const links = getLinkedPageTitlesUnderUid(titleUid);
    return links
      .map((link) => ({ link, linkUid: getPageUidByPageTitle(link) }))
      .find(({ linkUid }) =>
        getLinkedPageTitlesUnderUid(linkUid).some((s) => s === HOME)
      );
  }
  return undefined;
};

const hashChangeListener = (newURL: string) => {
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
        }
      }
      return;
    } else if (
      getShallowTreeByParentUid(urlUid).some((t) =>
        t.text.includes(`#[[${HOME}]]`)
      )
    ) {
      setTimeout(() => {
        Array.from(
          document.getElementsByClassName("rm-title-arrow-wrapper")
        ).forEach((d) => {
          const parent = document.createElement("div");
          d.appendChild(parent);
          (parent.previousElementSibling as HTMLDivElement).style.marginRight =
            "32px";
          joinGameRender({
            p: parent,
            name: d.querySelector(".rm-page__title").innerHTML,
          });
        });
      }, 100);
      return;
    }
    const gameType = getPostGameType(urlUid);
    if (gameType) {
      setTimeout(() => {
        const mainChildren = document.querySelector(
          ".roam-article>div>.rm-block-children"
        );
        const div = document.createElement("div");
        div.style.marginTop = '64px';
        postGameRender({ d: div, title: gameType.link, uid: gameType.linkUid });
        mainChildren.parentElement.appendChild(div);
      }, 100);
    } else if (getPageTitleByPageUid(urlUid) === "roam/js") {
      redirectHome();
    }
  } else {
    redirectHome();
  }
};

window.addEventListener("hashchange", (e) => hashChangeListener(e.newURL));
hashChangeListener(window.location.href);

/*
Run this to hack the home page message to a bunch of daily note pages
declare global {
  interface Window {
    toRoamDate: typeof toRoamDate;
    toRoamDateUid: typeof toRoamDateUid;
  }
}
window.toRoamDate = toRoamDate;
window.toRoamDateUid = toRoamDateUid;
const today = new Date();
for (let i = 0; i < 100; i++) {
  today.setDate(today.getDate() + 1);
  const uid = window.toRoamDateUid(today);
  window.roamAlphaAPI.createPage({
    page: { title: window.toRoamDate(today), uid },
  });
  window.roamAlphaAPI.createBlock({
    location: { "parent-uid": uid, order: 0 },
    block: { string: "{{embed:((o8Rj6wDqk))}}" },
  });
}
*/