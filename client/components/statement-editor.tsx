import { useVerifier } from "hooks/verifier-context";
import type { CardStatement, Patch } from "schema/verifier";
import { Input } from "./input";
import TextareaAutosize from "react-textarea-autosize";
import { StatementVerifiablityAnalysis } from "./statement-verifiability-analysis";
import { StatementVerificationAnalysis } from "./statement-verification-analysis";
import { PromptButton } from "./prompt-button";
import { useAgent } from "lib/stream/hook";
import { connection } from "lib/stream/index.client";
import * as Menu from "./menu";
import { editorMenuHandle, EditorMenuPortal } from "./editor-menu-portal";
import { EllipsisVertical } from "lucide-react";

export function StatementEditor({
  blockId,
  blockIndex,
  statementId,
  statementIndex,
  statement,
}: {
  blockId: string;
  blockIndex: number;
  statementId: string;
  statementIndex: number;
  statement: CardStatement;
}) {
  const {
    card,
    updateStatementText,
    updateStatementEmoji,
    applyPatchChunk: applyPatch,
  } = useVerifier();
  const { isLoading, error, status, sendToolAction } = useAgent({
    connection,
    onChunk: (chunk) => {
      console.log("Received chunk:", chunk);
      applyPatch(chunk as unknown as Patch[]);
    },
  });

  const recommendStatementVariants = (statementId: string, prompt?: string) => {
    const graphCard = {
      ...card,
      topics: card.topics.map((topic) => topic.value),
    };
    sendToolAction(
      {
        content: [
          {
            type: "action",
            action: "recommend_statement_variants",
            payload: { statement_id: statementId, prompt },
          },
        ],
      },
      {
        card: graphCard,
      },
    );
  };

  return (
    <>
      <div className="w-full contents">
        <div className="group/statement">
          <div className="text-neutral-500 mt-3 text-sm font-mono">
            {statementIndex == 0 ? "Hlavní tvrzení" : "Doplňující tvrzení"}
          </div>
          <div className="flex sticky bg-[#ededed] z-[20] top-0 -mr-6 mb-2 py-1">
            {statementIndex == 0 && (
              <Input
                value={statement.emoji}
                placeholder="?"
                className="w-8! h-8! rounded-full! bg-white text-base text-center px-0! mr-4"
                onChange={(e) =>
                  updateStatementEmoji(blockId, statementId, e.target.value)
                }
              />
            )}
            <TextareaAutosize
              value={statement.text}
              placeholder="Tvrzení"
              name="statement"
              maxRows={3}
              className="w-full rounded-md resize-none py-1 min-h-8 pl-2 pr-2 bg-white hover:bg-white focus:bg-white text-neutral-900 focus:outline-1 focus:-outline-offset-1 focus:outline-neutral-400 placeholder:text-neutral-500 flex-1 text-base"
              onChange={(e) =>
                updateStatementText(blockId, statementId, e.target.value)
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
              handle={editorMenuHandle}
              className="group/trigger group-hover/statement:flex bg-transparent! py-0! h-8! px-1!"
            >
              <EllipsisVertical className="size-4 hidden group-hover/statement:block group-aria-expanded/trigger:block" />
              <div className="size-4 block group-hover/statement:hidden group-aria-expanded/trigger:hidden"></div>
            </Menu.Trigger>
          </div>
        </div>
        <div className="pl-12">
          <div className="relative pt-1 pb-6">
            {/*<div className="flex h-7">
              <PromptButton
                isLoading={isLoading}
                onSubmit={(prompt) =>
                  recommendStatementVariants(statementId, prompt)
                }
                placeholderText="Téma…"
                buttonText="Navrhnout formulace"
              />
              <div className="mx-auto"></div>
            </div>*/}
            {statement.sources && statement.sources.order.length >= 1 && (
              <div className="absolute -left-6 top-0 bottom-0 w-6 border-l-2 border-neutral-400 hidden cara z-10"></div>
            )}
            <div className="rounded-xl mt-4 overflow-hidden divide-y divide-neutral-200">
              {statement.verifiability_analysis && (
                <StatementVerifiablityAnalysis statement={statement} />
              )}
              {statement.verification_analysis && (
                <StatementVerificationAnalysis statement={statement} />
              )}
            </div>
          </div>
        </div>
      </div>
      <EditorMenuPortal />
    </>
  );
}
