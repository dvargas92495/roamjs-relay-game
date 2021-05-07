import React, { useMemo, useState } from "react";
import { Card, Button, Label, InputGroup } from "@blueprintjs/core";
import { createComponentRender, MenuItemSelect } from "roamjs-components";
import { getPageTitleReferencesByPageTitle } from "roam-client";

const RelayGameButton = () => {
  const [gameLabel, setGameLabel] = useState("");
  const items = useMemo(
    () => getPageTitleReferencesByPageTitle("Relay Game"),
    []
  );
  const [activeItem, setActiveItem] = useState(items[0]);
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
      <Button>Start Game</Button>
    </Card>
  );
};

export const render = createComponentRender(RelayGameButton);

export default RelayGameButton;
