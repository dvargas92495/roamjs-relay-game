import {
  createButtonObserver,
  createPage,
  getShallowTreeByParentUid,
  getPageUidByPageTitle,
} from "roam-client";
import { render } from "./components/RelayGameButton";

const lobbyUid =
  getPageUidByPageTitle("Lobby") || createPage({ title: "Lobby" });
setTimeout(() => {
  getShallowTreeByParentUid(lobbyUid);
})

createButtonObserver({
  shortcut: "relay",
  attribute: "relay game",
  render: (b: HTMLButtonElement) => {
    render({ parent: b.parentElement });
  },
});
