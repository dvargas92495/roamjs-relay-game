import React from "react";
import { Dialog } from "@blueprintjs/core";
import ReactDOM from "react-dom";

const CreateGameDialog = ({ onClose }: { onClose: () => void }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      canOutsideClickClose
      canEscapeKeyClose
      title={"Create Relay Game"}
    ></Dialog>
  );
};

export const render = () => {
  const parent = document.createElement("div");
  ReactDOM.render(
    <CreateGameDialog onClose={() => console.log("close")} />,
    parent
  );
};

export default CreateGameDialog;
