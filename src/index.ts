import { createButtonObserver } from "roam-client";

window.alert("Welcome to the Relay Game!");

createButtonObserver({
  shortcut: "relay",
  attribute: "relay game",
  render: (b: HTMLButtonElement) => {
    b.innerText = "RELAY!";
  },
});
