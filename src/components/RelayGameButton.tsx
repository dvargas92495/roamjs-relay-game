import React from "react";
import { Card, Button } from "@blueprintjs/core";
import ReactDOM from "react-dom";

const RelayGameButton = () => {
  return (
    <Card>
      <Button>Start Game</Button>
    </Card>
  );
};

export const render = ({ parent }: { parent: HTMLElement }) =>
  ReactDOM.render(<RelayGameButton />, parent);

export default RelayGameButton;
