import {
  Button,
  Card,
  Classes,
  Drawer,
  Intent,
  Position,
} from "@blueprintjs/core";
import React, { useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  getCurrentPageUid,
  getRoamUrl,
  getShallowTreeByParentUid,
  getTreeByBlockUid,
  TreeNode,
} from "roam-client";
import { toFlexRegex } from "roamjs-components";

type Props = { title: string; uid: string };

const Node = (n: TreeNode) => (
  <>
    <span>{n.text}</span>
    {!!n.children.length && (
      <ul>
        {n.children.map((n) => (
          <li key={n.uid}>
            <Node {...n} />
          </li>
        ))}
      </ul>
    )}
  </>
);

const DrawerContent = () => {
  const pageUid = useMemo(getCurrentPageUid, []);
  const vcUid = getShallowTreeByParentUid(pageUid).find((t) =>
    toFlexRegex("Version Control").test(t.text)
  )?.uid;
  const states = getTreeByBlockUid(vcUid).children;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "fit-content",
        overflowX: "scroll",
      }}
    >
      {states.map((s) => (
        <Card
          title={s.text}
          key={s.uid}
          style={{
            margin: "8px 4px 8px",
            width: 256,
            minWidth: 256,
          }}
        >
          <Node {...s} />
        </Card>
      ))}
    </div>
  );
};

const PostGameButton = ({ title, uid }: Props) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = useCallback(() => setDrawerOpen(true), [setDrawerOpen]);
  const close = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Button
        text={"View Game States"}
        intent={Intent.PRIMARY}
        onClick={open}
      />
      <Drawer
        isOpen={drawerOpen}
        onClose={close}
        position={Position.BOTTOM}
        canEscapeKeyClose
        canOutsideClickClose
        isCloseButtonShown
        title={"Game States"}
        style={{
          height: "fit-content",
        }}
      >
        <DrawerContent />
      </Drawer>
      <Button
        text={`Play Another ${title} Game`}
        onClick={() => window.location.assign(getRoamUrl(uid))}
        intent={Intent.SUCCESS}
      />
    </div>
  );
};

export const render = ({ d, ...props }: { d: HTMLDivElement } & Props) =>
  ReactDOM.render(<PostGameButton {...props} />, d);

export default PostGameButton;
