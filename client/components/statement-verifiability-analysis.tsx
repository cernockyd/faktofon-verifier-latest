import type { CardStatement } from "schema/verifier";
import { formatDuration } from "date-fns";
import { cs } from "date-fns/locale";
import { Button } from "./button";
import {
  DataTable,
  StatusSummary,
  formatPercentage,
  type TableKeys,
  type Status,
} from "./data-table-experimental";
import { useVerifier } from "hooks/verifier-context";

const status = {
  verifiable: {
    state: "success",
    text: "Ověřitelné",
  },
  not_verifiable: {
    state: "error",
    text: "Tvrzení není ověřitelné",
  },
  not_verifiable_rhetorical_question: {
    state: "pass",
    text: "Jedná se o rétorickou otázku",
  },
};

const tableKeys: TableKeys = {
  proposition_verifiable: {
    name: "Je tvrzení ověřitelné?",
    format: formatPercentage,
  },
  proposition_verifiable_reasoning: {
    name: "Vysvětlení",
    format: (value) => value,
  },
  vagueness: {
    name: "Vágnost",
    format: formatPercentage,
  },
  context_dependency: {
    name: "Kontextová závislost",
    format: formatPercentage,
  },
  contains_ellipsis: {
    name: "Obsahuje elipsu",
    format: formatPercentage,
  },
  ambiguity: {
    name: "Mnohoznačnost",
    format: formatPercentage,
  },
  contains_implicit_content: {
    name: "Implicitní obsah",
    format: formatPercentage,
  },
  is_interrogative: {
    name: "Tázací otázka",
    format: formatPercentage,
  },
  is_rhetorical: {
    name: "Rétorická otázka",
    format: formatPercentage,
  },
  is_assertion: {
    name: "Tvrzení",
    format: formatPercentage,
  },
  proposition_timeframe: {
    name: "Časový rozsah",
    format: (value) =>
      formatDuration(
        {
          years: value?.years,
          months: value?.months,
          days: value?.days,
          hours: value?.hours,
        },
        {
          locale: cs,
        },
      ),
  },
};

export function StatementVerifiablityAnalysis({
  blockId,
  statementId,
  // statementIndex,
  statement,
}: {
  blockId: string;
  statementId: string;
  // statementIndex: number;
  statement: CardStatement;
}) {
  const data = statement.verifiability_analysis?.data;
  const analysis_status = statement.verifiability_analysis?.status;
  const { setRecommendedStatement } = useVerifier();

  return (
    <DataTable.Root>
      <DataTable.Trigger disabled={!data}>
        <DataTable.TriggerTitle>Ověřitelnost tvrzení</DataTable.TriggerTitle>
        {analysis_status ? (
          <StatusSummary
            mainStatus={
              status[analysis_status.status_code as keyof typeof status]
                .state as Status
            }
            // @ts-ignore
            text={status[analysis_status.status_code].text}
          />
        ) : (
          <StatusSummary mainStatus={"waiting"} />
        )}
      </DataTable.Trigger>
      {data && ["verifiable"].includes(analysis_status?.status_code || "") && (
        <DataTable.Pinned>
          <div>
            <div className="flex gap-4 justify-between">
              <p className="font-medium mb-2 text-sm text-neutral-800">
                Doporučené alternativy
              </p>
              <span className="text-sm text-neutral-500">
                Doporučení se mohou mýlit.
              </span>
            </div>
            <ul className="list-style-none pb-4 grid gap-2 grid-cols-3">
              {data.recommended_alternatives?.map((statement, i) => (
                <li
                  key={i}
                  className="gap-1 flex flex-col justify-between text-sm hover:[&>button]:bg-blue-400 hover:[&>button]:text-white items-end rounded-xl pl-3 pr-2 py-1.5 text-neutral-900 bg-neutral-200/70 hover:bg-blue-200/70 mb-1"
                >
                  {statement}
                  <Button
                    onClick={() =>
                      setRecommendedStatement(blockId, statementId, statement)
                    }
                    className="rounded-lg border-none bg-neutral-300 hover:bg-blue-500! hover:text-white px-2! py-0! text-sm! h-7!"
                  >
                    Použít
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </DataTable.Pinned>
      )}
      {data && (
        <DataTable.Panel>
          {Object.entries(tableKeys).map(([key]) => {
            return (
              <DataTable.Row name={tableKeys[key].name}>
                {tableKeys[key].format(data[key as keyof typeof data] as any)}
              </DataTable.Row>
            );
          })}
        </DataTable.Panel>
      )}
    </DataTable.Root>
  );
}
