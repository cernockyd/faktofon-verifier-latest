import { Input } from "./input";
import { Button } from "./button";
import { ArrowDown, ArrowUp, Ellipsis, Plus, Trash } from "lucide-react";
import { useVerifier } from "hooks/verifier-context";
import TopicCombobox, { type LabelItem } from "./topic-combobox";
import React, { useState, type JSX } from "react";
import { Menu as BaseUiMenu } from "@base-ui/react";
import TextareaAutosize from "react-textarea-autosize";
import * as Menu from "./menu";

export type Menus = {
  block: Menu.MenuItemDefinition<BlockMenuPayload>[];
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
    block: BlockMenuPayload;
    statement: StatementMenuPayload;
  };
};

const blockMenu = BaseUiMenu.createHandle<Payload>();

export function CardEditorBlockList() {
  const {
    card,
    updateCardTitle,
    selectedTopics,
    setSelectedTopics,
    topicsKey,
    selectedPath,
    setSelectedBlock,
    setSelectedStatement,
    updateStatementText,
    updateStatementEmoji,
    addBlock,
    deleteBlock,
    reorderBlock,
    isBlockSelectedInPath,
    isStatementSelectedInPath,
    addStatement,
    reorderStatement,
    deleteStatement,
  } = useVerifier();
  const initialLabels: LabelItem[] = [
    "ekonomika",
    "Ukrajina",
    "Válka na Ukrajině",
    "Česko",
    "EU",
    "Ekonomika a životní úroveň",
    "Rusko",
    "Neziskovky",
    "média",
    "volby 2025",
    "klima",
  ].map((label) => ({
    id: "id-" + label,
    value: label,
  }));

  const [labels, setLabels] = useState<LabelItem[]>(initialLabels);

  const MENUS = {
    block: [
      {
        label: "Posunout nahoru",
        icon: ArrowUp,
        renderCondition: (payload: BlockMenuPayload) => payload.blockIndex > 0,
        onClick: (e, payload: BlockMenuPayload) =>
          reorderBlock(payload.blockIndex, -1),
      },
      {
        label: "Posunout dolů",
        icon: ArrowDown,
        renderCondition: (payload: BlockMenuPayload) =>
          payload.blockIndex < card.blocks.order.length - 1,
        onClick: (e, payload: BlockMenuPayload) =>
          reorderBlock(payload.blockIndex, 1),
      },
      {
        label: "Odstranit",
        icon: Trash,
        onClick: (e, payload: BlockMenuPayload) => deleteBlock(payload.blockId),
      },
    ] as Menu.MenuItemDefinition<BlockMenuPayload>[],
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
          card.blocks.record[payload.blockId].statements.order.length - 1,
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
    <div className="flex flex-col w-xs xl:w-sm 2xl:w-md mb-10">
      <div className="pl-4 pr-4 pt-2 2xl:pt-4 mb-6 2xl:mb-10">
        <TopicCombobox
          topicsKey={topicsKey}
          labels={labels}
          setLabels={setLabels}
          selected={selectedTopics}
          setSelected={setSelectedTopics}
        />
      </div>
      {card.blocks.order.map((blockId, blockIndex) => {
        const block = card.blocks.record[blockId];
        return (
          <div
            key={blockIndex}
            className="group/block pl-4 pb-4 pr-4 2xl:pr-6 flex"
          >
            <div
              onClick={(e) => {
                if (e.currentTarget === e.target) setSelectedBlock(blockId);
              }}
              className={
                "block flex-1 pb-2 rounded-xl" +
                (isBlockSelectedInPath(blockId, selectedPath)
                  ? " -outline-offset-2 outline-2 outline-neutral-400"
                  : " ")
              }
            >
              <div className="bg-neutral-300 rounded-full justify-between pl-4 pr-2 items-center flex py-1 pointer-events-none">
                <span className="text-sm text-neutral-700">
                  {blockIndex + 1}. Blok
                </span>
                <div className="flex items-center">
                  <Menu.Trigger
                    payload={{
                      data: {
                        blockId,
                        blockIndex,
                      },
                      menu: "block" as const,
                    }}
                    id={blockId}
                    handle={blockMenu}
                    className="group/trigger pointer-events-auto bg-transparent! px-1.5! h-6!"
                  >
                    <Ellipsis className="size-4 hidden group-hover/block:block group-aria-expanded/trigger:block" />
                    <div className="size-4 block group-hover/block:hidden group-aria-expanded/trigger:hidden"></div>
                  </Menu.Trigger>
                </div>
              </div>
              <div className="pl-4 pr-2 pb-2 flex flex-col gap-1 mt-2">
                {block.statements.order.map((statementId, statementIndex) => {
                  const statement = block.statements.record[statementId];
                  return (
                    <div key={statementIndex}>
                      <div className="flex group/statement">
                        {statementIndex == 0 && (
                          <Input
                            value={statement.emoji}
                            className={
                              "max-w-7 pl-0! px-0! text-center pr-0! rounded-full! h-7! py-0 mr-1 text-sm focus:outline-none hover:cursor-default border-none " +
                              (isStatementSelectedInPath(
                                blockId,
                                statementId,
                                selectedPath,
                              )
                                ? "bg-neutral-300 text-neutral-900 border-none"
                                : "bg-transparent")
                            }
                            placeholder="?"
                            onMouseDownCapture={(e) => {
                              e.stopPropagation();
                            }}
                            onFocus={() =>
                              setSelectedStatement(blockId, statementId)
                            }
                            onChange={(e) =>
                              updateStatementEmoji(
                                blockId,
                                statementId,
                                e.target.value,
                              )
                            }
                          />
                        )}
                        <div
                          className={
                            "text-sm w-full pr-2 flex resize-none focus:outline-none rounded-lg! hover:cursor-default border-none " +
                            (isStatementSelectedInPath(
                              blockId,
                              statementId,
                              selectedPath,
                            )
                              ? " bg-neutral-300 text-neutral-900 border-none"
                              : " bg-trasparent hover:bg-neutral-300/50 text-neutral-600")
                          }
                        >
                          <TextareaAutosize
                            value={statement.text}
                            placeholder="Tvrzení"
                            onFocus={() =>
                              setSelectedStatement(blockId, statementId)
                            }
                            className={
                              "text-sm w-full py-1 pl-1.5! resize-none focus:outline-none rounded-lg! hover:cursor-default leading-5 border-none"
                            }
                            maxRows={5}
                            onChange={(e) =>
                              updateStatementText(
                                blockId,
                                statementId,
                                e.target.value,
                              )
                            }
                          />
                          <Menu.Trigger
                            payload={{
                              data: {
                                blockId,
                                blockIndex,
                                statementId,
                                statementIndex,
                              },
                              menu: "statement" as const,
                            }}
                            handle={blockMenu}
                            className="group/trigger group-hover/statement:flex bg-transparent! h-full pl-1! pr-0! py-0!"
                          >
                            <Ellipsis className="size-4 hidden group-hover/statement:block group-aria-expanded/trigger:block" />
                            <div className="size-4 block group-hover/statement:hidden group-aria-expanded/trigger:hidden"></div>
                          </Menu.Trigger>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      <Menu.Root handle={blockMenu}>
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
    </div>
  );
}
