import React from "react";
import { Alert, Classes } from "@blueprintjs/core";
import { createOverlayRender } from "roamjs-components";
import { createPage, getDisplayNameByEmail } from "roam-client";

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
