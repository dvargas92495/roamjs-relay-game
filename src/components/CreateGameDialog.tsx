import React, { useState } from "react";
import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Intent,
  Label,
  Spinner,
  SpinnerSize,
} from "@blueprintjs/core";
import { createOverlayRender } from "roamjs-components";
import { createPage, getPageUidByPageTitle, getRoamUrl } from "roam-client";

const CreateGameDialog = ({ onClose }: { onClose: () => void }) => {
  const [pageName, setPageName] = useState("");
  const [source, setSource] = useState("");
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
        <Label>
          Name
          <InputGroup
            placeholder={"Enter name of game..."}
            value={pageName}
            onChange={(e) => setPageName((e.target as HTMLInputElement).value)}
            autoFocus
          />
        </Label>
        <Label>
          Source
          <InputGroup
            placeholder={"Where do the problems come from?"}
            value={source}
            onChange={(e) => setSource((e.target as HTMLInputElement).value)}
          />
        </Label>{" "}
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <span style={{ color: "darkred" }}>{error}</span>
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
                const uid = createPage({
                  title: pageName,
                  tree: [
                    {
                      text: "#[[Relay Game]]",
                    },
                    {
                      text: "Source",
                      children: [{ text: source }],
                    },
                  ],
                });
                setTimeout(() => {
                  window.location.assign(getRoamUrl(uid));
                  setLoading(false);
                  onClose();
                }, 50);
              }, 1);
            }}
            intent={Intent.PRIMARY}
            disabled={!pageName || !source}
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
