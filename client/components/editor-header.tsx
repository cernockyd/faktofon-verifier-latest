import { useVerifier } from "hooks/verifier-context";
import { Input } from "./input";
import { Button } from "./button";
import { Eye, List, Loader, PanelLeftOpen, Sparkle } from "lucide-react";
import { useDocumentSidebar } from "hooks/document-sidebar-context";
import clsx from "clsx";
import { fetchHttpStream, useAgent } from "lib/stream/hook";
import type { Patch } from "schema/verifier";

export default function EditorHeader() {
  const { showDocumentSidebar, setShowDocumentSidebar } = useDocumentSidebar();

  const {
    card,
    updateCardTitle,
    showCardSidebar,
    setShowCardSidebar,
    showPreviewSidebar,
    setShowPreviewSidebar,
    applyPatchChunk: applyPatch,
  } = useVerifier();

  const { isLoading, error, status, sendToolAction } = useAgent({
    connection: fetchHttpStream("http://localhost:8000/agent"),
    onChunk: (chunk) => {
      applyPatch(chunk as unknown as Patch[]);
    },
  });

  const verify = () => {
    const graphCard = {
      ...card,
      topics: card.topics.map((topic) => topic.value),
    };
    sendToolAction(
      {
        content: [
          {
            type: "action",
            action: "analyze",
            payload: {},
          },
        ],
      },
      {
        card: graphCard,
      },
    );
  };

  return (
    <div
      className={clsx(
        "flex right-0 left-0 border-b border-neutral-300 bg-[#ededed] sticky top-0 z-[40] pr-2",
      )}
    >
      <div className="flex items-center w-full relative">
        {!showDocumentSidebar && (
          <div className="border-r p-1.5 border-neutral-300">
            <Button
              className={
                "pointer-events-auto shrink-0 size-8! p-0! rounded-lg border-none hover:bg-neutral-300"
              }
              onClick={() => setShowDocumentSidebar(true)}
            >
              <PanelLeftOpen className="size-5" />
            </Button>
          </div>
        )}
        <div className="max-w-md w-full p-1">
          <Input
            value={card.title}
            onChange={(e) => updateCardTitle(e.target.value)}
            placeholder="Titulek karty"
            className="font-normal pointer-events-auto border-none text-base focus:bg-neutral-50 focus:outline-none h-9! px-3!"
          />
        </div>
        <div className="mx-auto"></div>
        <Button
          className="relative shrink-0 text-sm hover:bg-neutral-900! font-medium pointer-events-auto bg-neutral-800 active:bg-neutral-900! text-white! border-none h-9! rounded-xl"
          onClick={verify}
        >
          {isLoading ? (
            <Loader className="size-3 mr-2 -ml-0.5 animate-spin " />
          ) : (
            <Sparkle className="size-3 mr-2 -ml-0.5 fill-white" />
          )}{" "}
          Ověřit kartu
        </Button>
        {!showCardSidebar && (
          <Button
            onClick={(value) => setShowCardSidebar(!showCardSidebar)}
            className={clsx(
              "pointer-events-auto shrink-0 size-8! p-0! rounded-lg border-none hover:bg-neutral-200 absolute z-[50] top-[45px] left-0 self-start m-1.5",
            )}
          >
            <List className="size-5" />
          </Button>
        )}
        {!showPreviewSidebar && (
          <Button
            onClick={(value) => setShowPreviewSidebar(!showPreviewSidebar)}
            className={clsx(
              "pointer-events-auto shrink-0 size-8! p-0! rounded-lg border-none hover:bg-neutral-200 absolute z-[50] top-[45px] right-0 self-start m-1.5",
            )}
          >
            <Eye className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
