import { Menu as BaseUiMenu } from "@base-ui/react";
import * as Menu from "./menu";
import { ArrowDown, ArrowUp, Trash } from "lucide-react";
import { useVerifier } from "hooks/verifier-context";

export type Menus = {
  statement: Menu.MenuItemDefinition<StatementMenuPayload>[];
};

export type MenuKey = keyof Menus;

export type BlockMenuPayload = {
  blockId: string;
  blockIndex: number;
};
export type StatementMenuPayload = {
  statementId: string;
  statementIndex: number;
  blockId: string;
  blockIndex: number;
};

export type Payload = {
  menu: MenuKey;
  data: {
    statement: StatementMenuPayload;
  };
};

export const editorMenuHandle = BaseUiMenu.createHandle<Payload>();

export function EditorMenuPortal() {
  const { card, deleteBlock, reorderBlock, reorderStatement, deleteStatement } =
    useVerifier();

  const MENUS = {
    statement: [
      {
        label: "Posunout nahoru",
        icon: ArrowUp,
        renderCondition: (payload: StatementMenuPayload) =>
          payload.statementIndex > 0,
        onClick: (e, payload: StatementMenuPayload) =>
          reorderStatement(payload.blockId, payload.statementIndex, -1),
      },
      {
        label: "Posunout dolů",
        icon: ArrowDown,
        renderCondition: (payload: StatementMenuPayload) =>
          payload.statementIndex <
          card.blocks.record[payload.blockId]?.statements.order.length - 1,
        onClick: (e, payload: StatementMenuPayload) =>
          reorderStatement(payload.blockId, payload.statementIndex, 1),
      },
      {
        label: "Odstranit",
        icon: Trash,
        onClick: (e, payload: StatementMenuPayload) =>
          deleteStatement(payload.blockId, payload.statementId),
      },
    ] as Menu.MenuItemDefinition<StatementMenuPayload>[],
  };

  return (
    <>
      <Menu.Root handle={editorMenuHandle}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner align="start" sideOffset={0} className={"z-40"}>
              <Menu.Popup>
                {payload! &&
                  MENUS[(payload as unknown as Payload)!.menu]?.map(
                    (item, index) => {
                      if (
                        item.renderCondition &&
                        !item.renderCondition(
                          (payload as unknown as Payload)!.data,
                        )
                      ) {
                        return null;
                      }
                      return (
                        <Menu.Item
                          key={index}
                          onClick={(e) => {
                            if (item.onClick)
                              item.onClick(
                                e,
                                (payload as unknown as Payload)!.data,
                              );
                          }}
                        >
                          {item.icon && (
                            <item.icon className="size-4 mr-2 -ml-1" />
                          )}{" "}
                          {item.label}
                        </Menu.Item>
                      );
                    },
                  )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </>
  );
}
