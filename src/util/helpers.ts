import {
  getCurrentUserEmail,
  getCurrentUserUid,
  getDisplayNameByUid,
  getLinkedPageTitlesUnderUid,
  getPageUidByPageTitle,
} from "roam-client";

export const HOME = "Relay";

export const isPageRelayGame = (uid: string) => {
  const links = getLinkedPageTitlesUnderUid(uid);
  return links.some((link) =>
    getLinkedPageTitlesUnderUid(getPageUidByPageTitle(link)).some(
      (s) => s === HOME
    )
  );
};

export const getPlayerName = () =>
  getDisplayNameByUid(getCurrentUserUid()) || getCurrentUserEmail();

export const HIDE_CLASSNAME = ".roamjs-relay-hide";
