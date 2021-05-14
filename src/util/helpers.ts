import {
  getCurrentUserEmail,
  getCurrentUserUid,
  getDisplayNameByUid,
  getLinkedPageTitlesUnderUid,
  getPageUidByPageTitle,
} from "roam-client";

export const isPageRelayGame = (uid: string) => {
  const links = getLinkedPageTitlesUnderUid(uid);
  return links.some((link) =>
    getLinkedPageTitlesUnderUid(getPageUidByPageTitle(link)).some(
      (s) => s === "Relay Game"
    )
  );
};

export const getPlayerName = () =>
  getDisplayNameByUid(getCurrentUserUid()) || getCurrentUserEmail();
