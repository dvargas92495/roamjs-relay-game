import React, { useState } from "react";
import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Intent,
  Spinner,
  SpinnerSize,
} from "@blueprintjs/core";
import { createOverlayRender } from "roamjs-components";
import { createPage, getPageUidByPageTitle } from "roam-client";

const CreateGameDialog = ({ onClose }: { onClose: () => void }) => {
  const [pageName, setPageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      canOutsideClickClose
      canEscapeKeyClose
      title={"Create Relay Game"}
    >
      <div className={Classes.DIALOG_BODY}>
        <InputGroup
          placeholder={"Enter name of game..."}
          value={pageName}
          onChange={(e) => setPageName((e.target as HTMLInputElement).value)}
        />
        <span style={{ color: "darkred" }}>{error}</span>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {loading && <Spinner size={SpinnerSize.SMALL} />}
          <Button
            text={"Create"}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                if (getPageUidByPageTitle(pageName)) {
                  setError(
                    "Page already exists. Pick a new page name for the game."
                  );
                  setLoading(false);
                  return;
                }
                createPage({
                  title: pageName,
                  tree: [
                    {
                      text: "#[[Relay Game]]",
                    },
                  ],
                });
                setLoading(false);
              }, 1);
            }}
            intent={Intent.PRIMARY}
            disabled={!pageName}
          />
        </div>
      </div>
    </Dialog>
  );
};

export const render = createOverlayRender(
  "create-relay-game",
  CreateGameDialog
);

export default CreateGameDialog;
