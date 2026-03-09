import { Menu as BaseUiMenu } from "@base-ui/react";
import * as Menu from "./menu";
import { useVerifier } from "hooks/verifier-context";
import { Button } from "./button";
import {
  ArrowDown,
  ArrowUp,
  EllipsisVertical,
  Plus,
  Trash,
} from "lucide-react";
import type { CardStatement, Patch } from "schema/verifier";
import { SourceEditor } from "./source-editor";
import { fetchHttpStream, useAgent } from "lib/stream/hook";
import { useEffect } from "react";
import { PromptButton } from "./prompt-button";

export type Menus = {
  resource: Menu.MenuItemDefinition<ResourceMenuPayload>[];
};

export type MenuKey = keyof Menus;

export type ResourceMenuPayload = {
  blockId: string;
  statementId: string;
  sourceIndex: number;
  sourceId: string;
};

export type Payload = {
  menu: MenuKey;
  data: {
    resource: ResourceMenuPayload;
  };
};

const sourceMenu = BaseUiMenu.createHandle<Payload>();

export function SourceList({
  blockId,
  statementId,
  statement,
}: {
  blockId: string;
  statementId: string;
  statement: CardStatement;
}) {
  const {
    card,
    addSource,
    deleteSource,
    reorderSource,
    applyPatchChunk: applyPatch,
  } = useVerifier();
  const { isLoading, error, status, sendToolAction } = useAgent({
    connection: fetchHttpStream("http://localhost:8000/agent"),
    onChunk: (chunk) => {
      console.log("Received chunk:", chunk);
      applyPatch(chunk as unknown as Patch[]);
    },
  });

  useEffect(() => {
    console.log(error, status);
  }, [error, status]);

  const recommendSources = (statementId: string) => {
    const graphCard = {
      ...card,
      topics: card.topics.map((topic) => topic.value),
    };
    sendToolAction(
      {
        content: [
          {
            type: "action",
            action: "recommend_sources",
            payload: { statement_id: statementId },
          },
        ],
      },
      {
        card: graphCard,
      },
    );
  };

  const MENUS = {
    resource: [
      {
        label: "Posunout nahoru",
        icon: ArrowUp,
        renderCondition: (payload: ResourceMenuPayload) =>
          payload.sourceIndex > 0,
        onClick: (e, payload: ResourceMenuPayload) =>
          reorderSource(
            payload.blockId,
            payload.statementId,
            payload.sourceIndex,
            -1,
          ),
      },
      {
        label: "Posunout dolů",
        icon: ArrowDown,
        renderCondition: (payload: ResourceMenuPayload) =>
          payload.sourceIndex <
          (
            card.blocks.record[payload.blockId].statements.record[
              payload.statementId
            ].sources || { order: [] }
          ).order.length -
            1,
        onClick: (e, payload: ResourceMenuPayload) =>
          reorderSource(
            payload.blockId,
            payload.statementId,
            payload.sourceIndex,
            1,
          ),
      },
      {
        label: "Odstranit",
        icon: Trash,
        onClick: (e, payload: ResourceMenuPayload) =>
          deleteSource(payload.blockId, payload.statementId, payload.sourceId),
      },
    ] as Menu.MenuItemDefinition<ResourceMenuPayload>[],
  };

  return (
    <div className="pt-4 -mr-6 ml-auto relative">
      {statement.sources?.order.map((sourceId, sourceIndex) => {
        const source = statement.sources!.record[sourceId];
        return (
          <div className="relative group/resource flex" key={sourceIndex}>
            <div className="absolute -left-6 -top-6 bottom-[50%] w-6 border-b-2 rounded-bl-lg border-l-2 border-neutral-400 hidden cara z-10"></div>
            {statement.sources?.order.length != sourceIndex + 1 && (
              <div className="absolute -left-6 top-0 bottom-0 w-6 border-l-2 border-neutral-400 hidden cara z-10"></div>
            )}
            <SourceEditor
              source={source}
              sourceId={sourceId}
              sourceIndex={sourceIndex}
              blockId={blockId}
              statementId={statementId}
            />
            <Menu.Trigger
              payload={{
                data: {
                  blockId,
                  statementId,
                  sourceId,
                  sourceIndex,
                },
                menu: "resource" as const,
              }}
              handle={sourceMenu}
              className="group/trigger mt-7 bg-transparent! px-1! h-6!"
            >
              <EllipsisVertical className="size-4 hidden group-hover/resource:block group-aria-expanded/trigger:block" />
              <div className="size-4 block group-hover/resource:hidden group-aria-expanded/trigger:hidden"></div>
            </Menu.Trigger>
          </div>
        );
      })}
      <div className="flex justify-items-start gap-4 pr-6">
        <Button
          className="text-sm rounded-lg shrink-0 px-2! h-7! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
          onClick={() =>
            addSource(
              blockId,
              statementId,
              statement.sources?.order.length || 0,
            )
          }
        >
          <Plus className="size-4 mr-1 -ml-0.5" />
          Zdroj
        </Button>
        <PromptButton
          isLoading={isLoading}
          onSubmit={(prompt) => recommendSources(statementId)}
          buttonText="Doporučit zdroj"
          placeholderText="Typ…"
        />
      </div>
      <Menu.Root handle={sourceMenu}>
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
