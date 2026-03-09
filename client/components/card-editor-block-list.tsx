import { Input } from "./input";
import { Button } from "./button";
import { ArrowDown, ArrowUp, Ellipsis, Plus, Trash } from "lucide-react";
import { useVerifier } from "hooks/verifier-context";
import TopicCombobox, { type LabelItem } from "./topic-combobox";
import React, { useState, type JSX } from "react";
import { Menu as BaseUiMenu } from "@base-ui/react";
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
    <div className="flex flex-col  w-md mb-10">
      <div className="pl-4 pr-6 pt-4 mb-10">
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
            className="group/block pl-4 pb-4 pr-0 hover:pr-0 flex"
          >
            <div
              onClick={(e) => {
                if (e.currentTarget === e.target) setSelectedBlock(blockId);
              }}
              className={
                "block p-2 bg-white flex-1 rounded-2xl" +
                (isBlockSelectedInPath(blockId, selectedPath)
                  ? " -outline-offset-2 outline-2 outline-neutral-400"
                  : " bg-white")
              }
            >
              {block.statements.order.map((statementId, statementIndex) => {
                const statement = block.statements.record[statementId];
                return (
                  <div key={statementIndex}>
                    <div className="flex group/statement">
                      {statementIndex == 0 && (
                        <Input
                          value={statement.emoji}
                          className={
                            "max-w-8 pl-0! text-center pr-0! rounded-full! h-8! mr-1.5 text-sm focus:outline-none hover:cursor-default border-none " +
                            (isStatementSelectedInPath(
                              blockId,
                              statementId,
                              selectedPath,
                            )
                              ? "bg-neutral-200 border-none"
                              : "bg-white")
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
                      <Input
                        value={statement.text}
                        placeholder="Tvrzení"
                        onFocus={() =>
                          setSelectedStatement(blockId, statementId)
                        }
                        autoComplete="off"
                        className={
                          "text-sm h-8! px-1.5! focus:outline-none hover:cursor-default border-none " +
                          (isStatementSelectedInPath(
                            blockId,
                            statementId,
                            selectedPath,
                          )
                            ? " bg-neutral-200 text-neutral-900! border-none"
                            : "bg-white hover:bg-neutral-100")
                        }
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
                        className="group/trigger group-hover/statement:flex bg-transparent! h-8! pl-1! pr-0! py-0!"
                      >
                        <Ellipsis className="size-4 hidden group-hover/statement:block group-aria-expanded/trigger:block" />
                        <div className="size-4 block group-hover/statement:hidden group-aria-expanded/trigger:hidden"></div>
                      </Menu.Trigger>
                    </div>
                  </div>
                );
              })}
              <Button
                className="text-sm rounded-lg px-3! h-7! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
                onClick={() =>
                  addStatement(blockId, block.statements.order.length)
                }
              >
                <Plus className="size-4 stroke-2 mr-1.5 -ml-0.5" /> Nové tvrzení
              </Button>
            </div>
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
                className="group/trigger bg-transparent! px-1.5! h-6!"
              >
                <Ellipsis className="size-4 hidden group-hover/block:block group-aria-expanded/trigger:block" />
                <div className="size-4 block group-hover/block:hidden group-aria-expanded/trigger:hidden"></div>
              </Menu.Trigger>
            </div>
          </div>
        );
      })}
      <Button
        className="text-sm rounded-lg ml-5 mr-7 px-3! h-8! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
        onClick={() => addBlock(card.blocks.order.length)}
      >
        <Plus className="size-4 mr-1.5 -ml-0.5" /> Nový blok
      </Button>
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
