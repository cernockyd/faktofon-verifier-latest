import React, { useState } from "react";
import { useDocument, type AutomergeUrl, useRepo } from "@automerge/react";
import { initCard } from "./editor";
import { formatRelative } from "date-fns";
import { cs } from "date-fns/locale";

import { type RootDocument } from "../rootDoc.client";
import { useEffect } from "react";
import type { Card } from "schema/verifier";
import { Button } from "./button";
import { Braces, Copy, Ellipsis, Import, Plus, Trash } from "lucide-react";
import * as Menu from "./menu";
import { Menu as BaseUiMenu } from "@base-ui/react/menu";
import {
  NaiveCardSchema,
  type NaiveCard,
  type ReorderableArray,
} from "schema/verifier";
import { v4 as uuidv4 } from "uuid";
import type { ZodType } from "zod";

export type Menus = {
  document: Menu.MenuItemDefinition<DocumentMenuPayload>[];
};

export type MenuKey = keyof Menus;

export type DocumentMenuPayload = {
  docUrl: AutomergeUrl;
  docIndex: number;
};

export type Payload = {
  menu: MenuKey;
  data: {
    document: DocumentMenuPayload;
  };
};

const documentMenu = BaseUiMenu.createHandle<Payload>();

export function arrayToReorderable<T extends { id: string }, R>(
  items: Omit<T, "id">[],
): ReorderableArray<ZodType<R>> {
  return items.reduce<ReorderableArray<ZodType<R>>>(
    (acc, item) => {
      const id = uuidv4();

      const fullItem = {
        ...item,
      } as R;

      acc.order.push(id);
      acc.record[id] = fullItem;

      return acc;
    },
    { order: [], record: {} },
  );
}

function naiveCardToCard(naive: NaiveCard): Card {
  return {
    ...naive,
    topics: naive.topics.map((topic) => ({
      id: "id-" + topic,
      value: topic,
    })),
    blocks: arrayToReorderable(
      // convert the statements in the blocks and sources in the statements the same way by calling the arrayToReorderable on the arrays
      naive.blocks.map((block) => ({
        ...block,
        statements: arrayToReorderable(
          block.statements.map((statement) => ({
            ...statement,
            sources: arrayToReorderable(statement?.sources || []),
          })),
        ),
      })),
    ),
  };

  // desired blocks
  // {
  //   order: [],
  //   record: {}
  // }
}

export const DocumentList: React.FC<{
  docUrl: AutomergeUrl;
  selectedDocument: AutomergeUrl | null;
  onSelectDocument: (docUrl: AutomergeUrl | null) => void;
}> = ({ docUrl, selectedDocument, onSelectDocument }) => {
  const [today, setToday] = useState<Date | null>(new Date());
  const repo = useRepo();
  const [doc, changeDoc] = useDocument<RootDocument>(docUrl, {
    suspense: true,
  });
  const [text, setText] = useState("");

  useEffect(() => {
    changeDoc((d) => {
      if (selectedDocument && !d.cards.includes(selectedDocument)) {
        // If the selected document is not in the list, add it
        d.cards.push(selectedDocument);
      }
    });
  }, [selectedDocument, changeDoc]);

  const handleNewDocument = () => {
    const card = repo.create<Card>(initCard());
    changeDoc((d) => d.cards.unshift(card.url));
    onSelectDocument(card.url);
  };

  const handleDeleteDocument = (docUrl: AutomergeUrl) => {
    onSelectDocument(null);
    changeDoc((d) => {
      const index = d.cards.indexOf(docUrl);
      if (index !== -1) {
        d.cards.splice(index, 1);
      }
    });
    repo.delete(docUrl as AutomergeUrl);
  };

  const handleDuplicateDocument = async (docUrl: AutomergeUrl) => {
    const handle = await repo.find<Card>(docUrl);
    const newHandle = repo.clone(handle);
    changeDoc((d) => {
      d.cards.unshift(newHandle.url);
    });
    onSelectDocument(newHandle.url);
  };

  const handleCopyJSON = async (docUrl: AutomergeUrl) => {
    const handle = await repo.find<Card>(docUrl);
    const doc = handle.doc();
    console.log("EXPORT", doc);
    await navigator.clipboard.writeText(JSON.stringify(doc));
  };

  const handleImport = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedData = JSON.parse(clipboardText);
      console.log("NEW CARD READ", parsedData);
      const validatedData = await NaiveCardSchema.safeParseAsync(parsedData);
      if (!validatedData.success) {
        console.error(validatedData.error);
        throw new Error("Error parsing the imported card.");
      }
      console.info("NEW CARD Parsed", validatedData.data);
      console.log("old card topics", validatedData.data.topics);
      const newCard = naiveCardToCard(validatedData.data);
      console.log("new card topics", newCard.topics);
      const card = repo.create(newCard);
      changeDoc((d) => d.cards.unshift(card.url));
      onSelectDocument(card.url);
    } catch (err) {
      console.error("Failed to import:", err);
    }
  };

  const MENUS = {
    document: [
      {
        label: "Duplikovat",
        icon: Copy,
        onClick: (e, payload: DocumentMenuPayload) =>
          handleDuplicateDocument(payload.docUrl),
      },
      {
        label: "Zkopírovat JSON",
        icon: Braces,
        onClick: (e, payload: DocumentMenuPayload) =>
          handleCopyJSON(payload.docUrl),
      },
      {
        label: "Odstranit",
        icon: Trash,
        onClick: (e, payload: DocumentMenuPayload) =>
          handleDeleteDocument(payload.docUrl),
      },
    ] as Menu.MenuItemDefinition<DocumentMenuPayload>[],
  };

  return (
    <div className="flex-1 flex flex-col w-60">
      <Button
        className="text-sm justify-start rounded-xl pl-2 pr-2 font-normal bg-transparent leading-tight border-none hover:bg-neutral-200 active:bg-neutral-300 active:shadow-none"
        onClick={handleNewDocument}
      >
        <Plus className="size-4 mr-2" />
        Nová karta
      </Button>
      <Button
        className="text-sm justify-start rounded-xl pl-2 pr-2 font-normal bg-transparent leading-tight border-none hover:bg-neutral-200 active:bg-neutral-300 active:shadow-none"
        onClick={handleImport}
      >
        <Import className="size-4 mr-2" />
        Importovat ze schránky
      </Button>
      <p className="text-sm text-neutral-500 mb-3 pt-8 pl-2">Karty</p>
      <ul className="list-none w-full flex flex-col flex-1">
        {doc.cards.map((docUrl, i) => (
          <li
            key={i}
            className={`w-full relative rounded-2xl flex  ${docUrl === selectedDocument ? "bg-neutral-200" : "bg-transparent"}`}
          >
            <Button
              className={`group text-sm w-full flex flex-col items-start pl-2 pr-1 pt-1.5 pb-1.5 font-normal bg-transparent active:bg-transparent hover:bg-transparent h-auto leading-tight border-none active:shadow-none `}
              onClick={() => onSelectDocument(docUrl)}
            >
              <div className="absolute rounded-2xl inset-0 z-0 group-active:bg-neutral-300 group-hover:bg-neutral-200/50"></div>
              <DocumentTitle docUrl={docUrl} today={today} />
            </Button>
            <Menu.Trigger
              payload={{
                data: {
                  docUrl,
                  docIndex: i,
                },
                menu: "document" as const,
              }}
              handle={documentMenu}
              className="group z-10 bg-transparent! px-3! h-full"
            >
              <div className="size-4 block group-hover:hidden"></div>
              <Ellipsis className="size-4 hidden group-hover:block" />
            </Menu.Trigger>
          </li>
        ))}
      </ul>

      <Menu.Root handle={documentMenu}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner align="start" className={"z-40"} sideOffset={-10}>
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
};

// Component to display document title
const DocumentTitle: React.FC<{ docUrl: AutomergeUrl; today: Date | null }> = ({
  docUrl,
  today,
}) => {
  const [doc] = useDocument<Card>(docUrl, { suspense: true });

  // Get the first task's title or use a default
  const title = doc.title || "Untitled Task List";
  return (
    <>
      <div className="text-left z-10">{title}</div>
      <div className="text-xs text-neutral-400 z-10">
        {doc.dateUpdated && today
          ? formatRelative(doc.dateUpdated, today, { locale: cs })
          : "Bez datumu"}
      </div>
    </>
  );
};
