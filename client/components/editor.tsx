// import "../index.css";
import type { Card, Patch } from "schema/verifier";
import {
  ArrowDown,
  PanelRightClose,
  List,
  ListIndentDecrease,
  Eye,
  Plus,
  Cross,
  X,
} from "lucide-react";
import { Toggle } from "./toggle";
import { useVerifier } from "hooks/verifier-context";
import { CardEditorBlockList } from "./card-editor-block-list";
import { StatementEditor } from "./statement-editor";
import { SourceList } from "./source-list";
import { Preview } from "./preview";
import clsx from "clsx";
import EditorHeader from "./editor-header";
import { Button } from "./button";
import { PromptButton } from "./prompt-button";
import { SourceEditor } from "./source-editor";
import { fetchHttpStream, useAgent } from "lib/stream/hook";
// A helper function to consistently initialize a task list.
export function initCard(): Card {
  return {
    title: `Karta bez názvu`,
    dateCreated: new Date(),
    dateUpdated: new Date(),
    topics: [],
    blocks: {
      record: {},
      order: [],
    },
  };
}

export function CardEditor() {
  const {
    card,
    showPreviewSidebar,
    setShowPreviewSidebar,
    showCardSidebar,
    setShowCardSidebar,
    selectedPath,
    setSelectedPath,
    isBlockSelectedInPathForRendering,
    isStatementSelectedInPathForRendering,
    addBlock,
    addStatement,
    editorViewRef,
    applyPatchChunk: applyPatch,
  } = useVerifier();

  const { isLoading, error, status, sendToolAction } = useAgent({
    connection: fetchHttpStream("http://localhost:8000/agent"),
    onChunk: (chunk) => {
      console.log("Received chunk:", chunk);
      applyPatch(chunk as unknown as Patch[]);
    },
  });

  const recommendBlocks = ({
    blocksCount,
    prompt,
  }: {
    blocksCount?: number;
    prompt?: string;
  }) => {
    console.log("Recommend block");
    const graphCard = {
      ...card,
      topics: card.topics.map((topic) => topic.value),
    };
    sendToolAction(
      {
        content: [
          {
            type: "action",
            action: "recommend_blocks",
            payload: { prompt, blocks_count: blocksCount },
          },
        ],
      },
      {
        card: graphCard,
      },
    );
  };

  return (
    <div className="flex-1 min-h-screen bg-[#ededed] relative">
      <EditorHeader />

      <div className={"flex flex-1"}>
        {showCardSidebar && (
          <div
            className={clsx(
              "flex flex-col h-[calc(100vh-45px)] bg-[#ededed] transition-all ease-out duration-300 overflow-scroll border-r",
              {
                "hover:border-neutral-300 border-transparent": showCardSidebar,
                "border-transparent": !showCardSidebar,
              },
            )}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const selector = "button, input, .block, [role='presentation']";
              if (target.closest(selector)) {
                return;
              }

              setSelectedPath([]);
            }}
          >
            <Toggle
              pressed={showCardSidebar}
              onPressedChange={(value) => setShowCardSidebar(!showCardSidebar)}
              className={clsx("pointer-events-auto shrink-0  m-1.5")}
              render={(props, state) => {
                if (state.pressed) {
                  return (
                    <button type="button" {...props}>
                      <ListIndentDecrease className="size-5" />
                    </button>
                  );
                }
                return (
                  <button type="button" {...props}>
                    <List className="size-5" />
                  </button>
                );
              }}
            />
            <CardEditorBlockList />
          </div>
        )}
        <div
          ref={editorViewRef}
          className="flex-1 h-[calc(100vh-45px)] bg-[#ededed] relative overflow-scroll pb-[40vh] pt-0"
        >
          <div className="w-full flex relative flex-col gap-8">
            {card.blocks.order.map((blockId, blockIndex) => {
              if (!isBlockSelectedInPathForRendering(blockId, selectedPath))
                return null;
              return (
                <div
                  key={blockIndex}
                  className={clsx("mb-0", {
                    "border-b border-neutral-300": selectedPath.length == 0,
                  })}
                >
                  <div className="justify-center py-2 flex relative mb-15">
                    <div className="flex items-center text-neutral-700 text-sm py-1 pl-3 pr-1.5 bg-neutral-300 rounded-full relative z-20">
                      {(() => {
                        if (selectedPath.length == 6)
                          return `Filtrováno tvrzení ${blockIndex + 1}. bloku`;
                        if (selectedPath.length == 3)
                          return `Filtrován ${blockIndex + 1}. blok`;
                        if (selectedPath.length < 3)
                          return `Začátek ${blockIndex + 1}. bloku`;
                      })()}
                      {selectedPath.length < 3 ? (
                        <div className="p-1 ml-2 rounded-full">
                          <ArrowDown className="size-4" />
                        </div>
                      ) : (
                        <Button
                          className="p-0! size-6! ml-2 rounded-full"
                          onClick={() => setSelectedPath([])}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {card.blocks.record[blockId].statements.order.map(
                    (statementId, statementIndex) => {
                      const statement =
                        card.blocks.record[blockId].statements.record[
                          statementId
                        ];

                      if (
                        !isStatementSelectedInPathForRendering(
                          blockId,
                          statementId,
                          selectedPath,
                        )
                      )
                        return null;

                      return (
                        <div
                          className="relative pb-30 mx-auto max-w-[960px] pl-10 pr-10"
                          key={statementIndex}
                        >
                          <StatementEditor
                            statement={statement}
                            statementId={statementId}
                            blockId={blockId}
                            blockIndex={blockIndex}
                            statementIndex={statementIndex}
                          />
                          <SourceList
                            statementId={statementId}
                            blockId={blockId}
                            statement={statement}
                          />
                        </div>
                      );
                    },
                  )}
                  {selectedPath.length <= 3 && (
                    <div className="mx-auto max-w-[960px] pr-10 pb-16 pl-10">
                      <div className="flex gap-5">
                        <Button
                          className="text-sm rounded-lg shrink-0 px-3! h-8! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
                          onClick={() =>
                            addStatement(
                              blockId,
                              card.blocks.record[blockId].statements.order
                                .length,
                            )
                          }
                        >
                          <Plus className="size-4 mr-1.5 -ml-0.5" /> Tvrzení
                        </Button>
                        <PromptButton
                          isLoading={false}
                          onSubmit={() => undefined}
                          buttonText="Navrhnout tvrzení"
                          placeholderText="Téma…"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {selectedPath.length == 0 && (
              <div>
                <div className="flex mx-auto max-w-[960px] pt-8 pr-10 pl-10 gap-8">
                  <Button
                    className="text-sm rounded-lg shrink-0 px-4! h-9! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
                    onClick={() => addBlock(card.blocks.order.length)}
                  >
                    <Plus className="size-5 mr-2 -ml-1" /> Blok
                  </Button>
                  <PromptButton
                    isLoading={isLoading}
                    onSubmit={(prompt) => recommendBlocks({ prompt })}
                    buttonText="Navrhnout bloky"
                    placeholderText="Téma…"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {showPreviewSidebar && (
          <div
            className={clsx(
              "flex flex-col px-2 relative justify-self-end justify-start border-l overflow-y-scroll h-[calc(100vh-45px)]",
              {
                "bg-[#ededed] border-transparent sticky top-0 right-0":
                  !showPreviewSidebar,
                "bg-white border-neutral-200": showPreviewSidebar,
              },
            )}
          >
            <div
              className={clsx("sticky py-2 top-0", {
                "bg-transparent": !showPreviewSidebar,
                "bg-white": showPreviewSidebar,
              })}
            >
              <Toggle
                pressed={showPreviewSidebar}
                onPressedChange={(value) =>
                  setShowPreviewSidebar(!showPreviewSidebar)
                }
                render={(props, state) => {
                  if (state.pressed) {
                    return (
                      <button type="button" {...props}>
                        <PanelRightClose className="size-5" />
                      </button>
                    );
                  }
                  return (
                    <button type="button" {...props}>
                      <Eye className="size-5" />
                    </button>
                  );
                }}
              />
            </div>
            <Preview />
          </div>
        )}
      </div>
    </div>
  );
}
