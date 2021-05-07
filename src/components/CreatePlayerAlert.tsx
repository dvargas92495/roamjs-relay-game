import React from "react";
import { Alert, Classes } from "@blueprintjs/core";
import { createOverlayRender } from "roamjs-components";
import { createPage, getDisplayNameByEmail, getRoamUrlByPage } from "roam-client";

const CreatePlayerAlert = ({
  onClose,
  email,
}: {
  onClose: () => void;
  email: string;
}) => {
  const pageName = getDisplayNameByEmail(email) || email;
  return (
    <Alert
      isOpen={true}
      onClose={onClose}
      onConfirm={() => {
        createPage({
          title: pageName,
          tree: [
            {
              text: `Email:: ${email}`,
            },
            { text: "Roles", children: [{ text: "Player" }] },
            { text: "Game History" },
          ],
        });
        setTimeout(() => {
          window.location.assign(getRoamUrlByPage(pageName));
          onClose();
        }, 50);
      }}
    >
      <div className={Classes.ALERT_BODY}>
        Welcome to Relay App! Since this is your first time on the app, we will
        create your profile page now.
      </div>
    </Alert>
  );
};

export const render = createOverlayRender<{email:string}>(
  "create-relay-player",
  CreatePlayerAlert
);

export default CreatePlayerAlert;
