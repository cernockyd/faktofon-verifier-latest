import { useVerifier } from "hooks/verifier-context";
import type { CardStatement } from "schema/verifier";
import { Input } from "./input";
import TextareaAutosize from "react-textarea-autosize";
import { StatementVerifiablityAnalysis } from "./statement-verifiability-analysis";
import { StatementVerificationAnalysis } from "./statement-verification-analysis";
import { PromptButton } from "./prompt-button";

export function StatementEditor({
  blockId,
  statementId,
  statementIndex,
  statement,
}: {
  blockId: string;
  statementId: string;
  statementIndex: number;
  statement: CardStatement;
}) {
  const { updateStatementText, updateStatementEmoji } = useVerifier();

  return (
    <div className="w-full contents">
      <div className="text-neutral-500 mt-3 text-sm font-mono">
        {statementIndex == 0 ? "Hlavní tvrzení" : "Doplňující tvrzení"}
      </div>
      <div className="flex sticky bg-[#ededed] z-[50] top-0 mb-2 py-1">
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
          maxRows={3}
          className="w-full rounded-md py-1 min-h-8 pl-2 pr-2 bg-white hover:bg-white focus:bg-white text-neutral-900 focus:outline-1 focus:-outline-offset-1 focus:outline-neutral-400 placeholder:text-neutral-500 flex-1 text-base"
          onChange={(e) =>
            updateStatementText(blockId, statementId, e.target.value)
          }
        />
      </div>
      <div className="pl-12">
        <div className="relative pt-1 pb-6">
          <div className="flex h-7">
            <PromptButton
              isLoading={false}
              onSubmit={() => undefined}
              placeholderText="Téma…"
              buttonText="Navrhnout formulaci"
            />
            <div className="mx-auto"></div>
          </div>
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
  );
}
