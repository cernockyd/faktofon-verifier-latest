import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import {
  type AutomergeUrl,
  useDocument,
  updateText,
  insertAt,
  deleteAt,
} from "@automerge/react";
import type { Card, Patch, PatchPath } from "schema/verifier";
import { v4 as uuidv4 } from "uuid";
import { type LabelItem } from "components/topic-combobox";
import { setValueAtPath } from "utils/json-patch";

type VerifierContextType = {
  card: Card;

  applyPatchChunk: (patch: Patch[]) => void;

  showCardSidebar: boolean;
  setShowCardSidebar: (value: boolean) => void;

  showPreviewSidebar: boolean;
  setShowPreviewSidebar: (value: boolean) => void;

  selectedPath: string[];
  setSelectedPath: (value: string[]) => void;

  setSelectedBlock: (blockId: string) => void;
  setSelectedStatement: (blockId: string, statementId: string) => void;

  updateCardTitle: (value: string) => void;

  selectedTopics: LabelItem[];
  setSelectedTopics: Dispatch<SetStateAction<LabelItem[]>>;
  topicsKey: number;

  addBlock: (insertIndex: number) => void;
  deleteBlock: (blockId: string) => void;

  addStatement: (blockId: string, insertIndex: number) => void;
  deleteStatement: (blockId: string, statementId: string) => void;

  updateStatementText: (
    blockId: string,
    statementId: string,
    value: string,
  ) => void;

  addSource: (
    blockId: string,
    statementId: string,
    insertIndex: number,
  ) => void;

  deleteSource: (
    blockId: string,
    statementId: string,
    sourceId: string,
  ) => void;

  updateStatementEmoji: (
    blockId: string,
    statementId: string,
    value: string,
  ) => void;

  changeJSON: (value: string) => void;

  isBlockSelectedInPath: (blockId: string, path: PatchPath) => boolean;
  isBlockSelectedInPathForRendering: (
    blockId: string,
    path: PatchPath,
  ) => boolean;

  isStatementSelectedInPath: (
    blockId: string,
    statementId: string,
    path: PatchPath,
  ) => boolean;
  isStatementSelectedInPathForRendering: (
    blockId: string,
    statementId: string,
    path: PatchPath,
  ) => boolean;
  reorderStatement: (
    blockId: string,
    statementIndex: number,
    change: number,
  ) => void;
  reorderBlock: (blockIndex: number, change: number) => void;
  reorderSource: (
    blockId: string,
    statementId: string,
    sourceIndex: number,
    change: number,
  ) => void;
  setSourceType: (
    blockId: string,
    statementId: string,
    sourceId: string,
    type: string | null,
  ) => void;
};

const VerifierContext = createContext<VerifierContextType | undefined>(
  undefined,
);

export const VerifierProvider = ({
  docUrl,
  children,
}: {
  docUrl: AutomergeUrl;
  children: ReactNode;
}) => {
  const [searchParams, setSearchParams] = useSearchParams({
    p: [],
    cs: "1",
    ps: "0",
  });
  const [card, changeDoc] = useDocument<Card>(docUrl, {
    // This hooks the `useDocument` into reacts suspense infrastructure so the whole component
    // only renders once the document is loaded
    suspense: true,
  });

  const [selectedTopics, setSelectedTopics] = useState<LabelItem[]>(() =>
    card.topics.map((topic) => ({ ...topic })),
  );
  const [topicsKey, setTopicsKey] = useState<number>(1);

  // I know this is gross
  useEffect(() => {
    changeDoc((d) => {
      d.topics = selectedTopics;
    });
    setTopicsKey(topicsKey + 1);
  }, [selectedTopics]);

  function applyPatchChunk(patches: Patch[]) {
    changeDoc((d) => {
      patches.forEach((patch) => {
        setValueAtPath(d, patch.path, patch.value);
      });
    });
  }

  function setShowPreviewSidebar(value: boolean) {
    setSearchParams((searchParams) => {
      searchParams.set("ps", value ? "1" : "0");
      return searchParams;
    });
  }

  const showPreviewSidebar = searchParams.get("ps") === "1";

  function setShowCardSidebar(value: boolean) {
    setSearchParams((searchParams) => {
      searchParams.set("cs", value ? "1" : "0");
      return searchParams;
    });
  }

  const showCardSidebar = searchParams.get("cs") === "1";

  function setSelectedPath(path: string[]) {
    setSearchParams((searchParams) => {
      searchParams.delete("p");
      path.forEach((p) => searchParams.append("p", p));
      return searchParams;
    });
  }

  const selectedPath = searchParams.getAll("p");

  function updateCardTitle(value: string) {
    changeDoc((d) => {
      updateText(d, ["title"], value);
    });
  }

  function addBlock(insertIndex: number) {
    changeDoc((d) => {
      const newId = uuidv4();
      const newStatementId = uuidv4();
      const newStatementId2 = uuidv4();
      d.blocks.record[newId] = {
        statements: {
          order: [newStatementId, newStatementId2],
          record: {
            [newStatementId]: {
              emoji: "",
              text: "Hlavní tvrzení",
              sources: {
                order: [],
                record: {},
              },
            },
            [newStatementId2]: {
              emoji: "",
              text: "Podporující tvrzení.",
              sources: {
                order: [],
                record: {},
              },
            },
          },
        },
      };
      insertAt(d.blocks.order, insertIndex, newId);
    });
  }

  function deleteBlock(blockId: string) {
    changeDoc((d) => {
      deleteAt(d.blocks.order, d.blocks.order.indexOf(blockId));
      delete d.blocks.record[blockId];
    });
  }

  function addStatement(blockId: string, insertIndex: number) {
    changeDoc((d) => {
      const block = d.blocks.record[blockId];
      const statements = block.statements;
      const newId = uuidv4();
      statements.record[newId] = {
        emoji: "",
        text: "Nové tvrzení",
        sources: {
          order: [],
          record: {},
        },
      };
      insertAt(statements.order, insertIndex, newId);
    });
  }

  function deleteStatement(blockId: string, statementId: string) {
    changeDoc((d) => {
      const block = d.blocks.record[blockId];
      deleteAt(
        block.statements.order,
        block.statements.order.findIndex((id) => id === statementId),
      );
      delete block.statements.record[statementId];
    });
  }

  function addSource(
    blockId: string,
    statementId: string,
    insertIndex: number,
  ) {
    changeDoc((d) => {
      const block = d.blocks.record[blockId];
      const statements = block.statements;
      const statement = statements.record[statementId];

      if (!statement.sources)
        statement.sources = {
          order: [],
          record: {},
        };
      const newId = uuidv4();
      statement.sources.record[newId] = {
        url: null,
        archive_url: null,
        name: null,
        date: null,
        verification: null,
        verification_user_interaction: null,
        type: null,
      };
      insertAt(statement.sources.order, insertIndex, newId);
    });
  }

  function deleteSource(
    blockId: string,
    statementId: string,
    sourceId: string,
  ) {
    changeDoc((d) => {
      const statement = d.blocks.record[blockId].statements.record[statementId];
      if (statement.sources) {
        deleteAt(
          statement.sources.order,
          statement.sources.order.findIndex((id) => id === sourceId),
        );
        delete statement.sources.record[sourceId];
      }
    });
  }

  function updateStatementText(
    blockId: string,
    statementId: string,
    value: string,
  ) {
    changeDoc((d) => {
      updateText(
        d,
        [
          "blocks",
          "record",
          blockId,
          "statements",
          "record",
          statementId,
          "text",
        ],
        value,
      );
    });
  }

  function updateStatementEmoji(
    blockId: string,
    statementId: string,
    value: string,
  ) {
    changeDoc((d) => {
      updateText(
        d,
        [
          "blocks",
          "record",
          blockId,
          "statements",
          "record",
          statementId,
          "emoji",
        ],
        value,
      );
    });
  }

  function changeJSON(json: string) {
    try {
      const parsed = JSON.parse(json.trim());
      changeDoc((d) => {
        d.blocks = parsed.blocks;
      });
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  }

  function isBlockSelectedInPath(blockId: string, path: PatchPath): boolean {
    const expected = ["blocks", "record", blockId];
    return (
      path.length != 0 &&
      path.length <= expected.length &&
      expected.every((value, index) => value === path[index])
    );
  }

  function isBlockSelectedInPathForRendering(
    blockId: string,
    path: PatchPath,
  ): boolean {
    const expected = ["blocks", "record", blockId];
    return (
      path.length == 0 ||
      expected.every((value, index) => value === path[index])
    );
  }

  function isStatementSelectedInPath(
    blockId: string,
    statementId: string,
    path: PatchPath,
  ): boolean {
    const expected = [
      "blocks",
      "record",
      blockId,
      "statements",
      "record",
      statementId,
    ];
    return (
      path.length === expected.length &&
      expected.every((value, index) => value === path[index])
    );
  }

  function isStatementSelectedInPathForRendering(
    blockId: string,
    statementId: string,
    path: PatchPath,
  ): boolean {
    const expected = [
      "blocks",
      "record",
      blockId,
      "statements",
      "record",
      statementId,
    ];
    return (
      path.length === 0 ||
      path.every((value, index) => value === expected[index]) ||
      expected.every((value, index) => value === path[index])
    );
  }

  function reorderStatement(
    blockId: string,
    statementIndex: number,
    change: number,
  ) {
    changeDoc((d) => {
      // experimental
      const block = d.blocks.record[blockId];
      const order = block.statements.order;
      const temp = order[statementIndex];
      const changeWithIndex = statementIndex + change;
      order[statementIndex] = order[changeWithIndex];
      order[changeWithIndex] = temp;
    });
  }

  function reorderBlock(blockIndex: number, change: number) {
    changeDoc((d) => {
      const order = d.blocks.order;
      const temp = order[blockIndex];
      const changeWithIndex = blockIndex + change;
      order[blockIndex] = order[changeWithIndex];
      order[changeWithIndex] = temp;
    });
  }

  function reorderSource(
    blockId: string,
    statementId: string,
    sourceIndex: number,
    change: number,
  ) {
    changeDoc((d) => {
      const statement = d.blocks.record[blockId].statements.record[statementId];
      const order = statement.sources.order;
      const temp = order[sourceIndex];
      const changeWithIndex = sourceIndex + change;
      order[sourceIndex] = order[changeWithIndex];
      order[changeWithIndex] = temp;
    });
  }

  function setSelectedBlock(blockId: string) {
    setSelectedPath(["blocks", "record", blockId]);
  }

  function setSelectedStatement(blockId: string, statementId: string) {
    setSelectedPath([
      "blocks",
      "record",
      blockId,
      "statements",
      "record",
      statementId,
    ]);
  }

  function setSourceType(
    blockId: string,
    statementId: string,
    sourceId: string,
    type: string | null,
  ) {
    changeDoc((d) => {
      const statement = d.blocks.record[blockId].statements.record[statementId];
      statement.sources.record[sourceId].type = type;
    });
  }

  return (
    <VerifierContext.Provider
      value={{
        applyPatchChunk,
        showPreviewSidebar,
        setShowPreviewSidebar,
        showCardSidebar,
        setShowCardSidebar,
        selectedPath,
        setSelectedPath,
        setSelectedBlock,
        setSelectedStatement,
        card,
        updateCardTitle,
        updateStatementText,
        updateStatementEmoji,
        selectedTopics,
        setSelectedTopics,
        setSourceType,
        topicsKey,
        addBlock,
        deleteBlock,
        addSource,
        deleteSource,
        addStatement,
        deleteStatement,
        changeJSON,
        isBlockSelectedInPath,
        isBlockSelectedInPathForRendering,
        isStatementSelectedInPath,
        isStatementSelectedInPathForRendering,
        reorderStatement,
        reorderBlock,
        reorderSource,
      }}
    >
      {children}
    </VerifierContext.Provider>
  );
};

export const useVerifier = () => {
  const context = useContext(VerifierContext);
  if (!context) {
    throw new Error("useVerifier must be used within VerifierProvider");
  }
  return context;
};
