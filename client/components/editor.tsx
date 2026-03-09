// import "../index.css";
import type { Card } from "schema/verifier";
import {
  ArrowDown,
  PanelRightClose,
  List,
  ListIndentDecrease,
  Eye,
  Plus,
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
// A helper function to consistently initialize a task list.
export function initCard(): Card {
  return {
    title: `Nepojmenovaná karta`,
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
  } = useVerifier();

  return (
    <div className="flex-1 min-h-screen bg-[#ededed] relative">
      <EditorHeader />

      <div className={"flex flex-1"}>
        {showCardSidebar && (
          <div
            className={clsx(
              "flex flex-col h-[calc(100vh-45px)] bg-[#ededed] overflow-scroll border-r",
              {
                "border-neutral-300": showCardSidebar,
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
        <div className="flex-1 h-[calc(100vh-45px)] bg-[#ededed] relative overflow-scroll pb-[40vh]">
          <div className="w-full flex relative flex-col gap-6">
            {card.blocks.order.map((blockId, blockIndex) => {
              if (!isBlockSelectedInPathForRendering(blockId, selectedPath))
                return null;
              return (
                <div key={blockIndex} className="mb-4">
                  {selectedPath.length < 4 && (
                    <div className="justify-center flex py-2 relative mb-15">
                      <span className="flex text-[#ededed] text-sm pl-4 pr-3 py-1 bg-neutral-400 rounded-full relative z-20">
                        Začátek {blockIndex + 1}. bloku
                        <ArrowDown className="size-4 mt-0.5 ml-1" />
                      </span>
                    </div>
                  )}
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
                  <div className="mx-auto max-w-[960px] pl-10">
                    <div className="flex gap-2 mb-4">
                      <Button
                        className="text-sm rounded-lg shrink-0 px-3! h-7! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
                        onClick={() => {}}
                      >
                        <Plus className="size-4 mr-1.5 -ml-0.5" /> Nové tvrzení
                      </Button>
                      <PromptButton
                        isLoading={false}
                        onSubmit={() => undefined}
                        buttonText="Navrhnout tvrzení"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div>
              <div className="flex mx-auto max-w-[960px] pl-10 gap-2 mb-4">
                <Button
                  className="text-sm rounded-lg shrink-0 px-3! h-7! border-none bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 text-white"
                  onClick={() => {}}
                >
                  <Plus className="size-4 mr-1.5 -ml-0.5" /> Nový blok
                </Button>
                <PromptButton
                  isLoading={false}
                  onSubmit={() => undefined}
                  buttonText="Navrhnout blok"
                />
              </div>
            </div>
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
