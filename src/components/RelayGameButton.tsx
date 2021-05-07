import React, { useMemo, useState } from "react";
import {
  Card,
  Button,
  Label,
  Icon,
  InputGroup,
  NumericInput,
} from "@blueprintjs/core";
import { createComponentRender, MenuItemSelect } from "roamjs-components";
import { getPageTitleReferencesByPageTitle } from "roam-client";

const RelayGameButton = () => {
  const [gameLabel, setGameLabel] = useState("");
  const items = useMemo(
    () => getPageTitleReferencesByPageTitle("Relay Game"),
    []
  );
  const [activeItem, setActiveItem] = useState(items[0]);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [timeLimit, setTimeLimit] = useState(10);
  return (
    <Card>
      <Label>
        Game Instance Label
        <InputGroup
          value={gameLabel}
          onChange={(e) => setGameLabel((e.target as HTMLInputElement).value)}
        />
      </Label>
      <Label>
        Games
        <MenuItemSelect
          activeItem={activeItem}
          items={items}
          onItemSelect={(s) => setActiveItem(s)}
        />
      </Label>
      <div
        onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
        style={{ cursor: "pointer", color: "darkblue" }}
      >
        <Icon icon={showAdditionalOptions ? "caret-down" : "caret-right"} />{" "}
        {showAdditionalOptions ? "Hide" : "Show"} Additional Options
      </div>
      {showAdditionalOptions && (
        <div>
          <Label>
            Time Limit Per Player (minutes)
            <NumericInput
              value={timeLimit}
              onValueChange={(n) => setTimeLimit(n)}
            />
          </Label>
        </div>
      )}
      <Button style={{ marginTop: 16 }} text={"Start Game"} disabled={!gameLabel} />
    </Card>
  );
};

export const render = createComponentRender(RelayGameButton);

export default RelayGameButton;
