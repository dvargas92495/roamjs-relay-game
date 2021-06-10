import { Button, Intent } from "@blueprintjs/core";
import React from "react";
import ReactDOM from "react-dom";
import { getRoamUrl } from "roam-client";

type Props = { title: string; uid: string };

const PostGameButton = ({ title, uid }: Props) => {
  return (
    <Button
      text={`Play another ${title} Game`}
      onClick={() => window.location.assign(getRoamUrl(uid))}
      intent={Intent.PRIMARY}
    />
  );
};

export const render = ({ d, ...props }: { d: HTMLDivElement } & Props) =>
  ReactDOM.render(<PostGameButton {...props} />, d);

export default PostGameButton;
