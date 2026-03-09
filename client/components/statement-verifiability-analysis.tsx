import type { CardStatement } from "schema/verifier";
import { formatDuration } from "date-fns";
import { cs } from "date-fns/locale";
import {
  DataTable,
  formatPercentage,
  StatusSummary,
  type TableKeys,
} from "./data-table";

const status = {
  verifiable: {
    state: "success",
    text: "Ověřitelné",
  },
  not_verifiable: {
    state: "error",
    text: "Tvrzení není ověřitelné",
  },
};

const tableKeys: TableKeys = {
  status: {
    name: "Souhrn",
    hideTitle: true,
    format: (value) =>
      value ? (
        <StatusSummary
          // @ts-ignore
          mainStatus={status[value.status_code].state}
          // @ts-ignore
          text={status[value.status_code].text}
        />
      ) : (
        <StatusSummary mainStatus={"waiting"} />
      ),
  },
  proposition_factual: {
    name: "Je tvrzení faktické?",
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
  // blockId,
  // statementId,
  // statementIndex,
  statement,
}: {
  // blockId: string;
  // statementId: string;
  // statementIndex: number;
  statement: CardStatement;
}) {
  // const { updateStatementText, updateStatementEmoji, verify, verifyLoading } =
  //   useVerifier();

  return (
    <DataTable
      data={statement.verifiability_analysis}
      tableKeys={tableKeys}
      triggerName="Ověřitelnost tvrzení"
    />
  );
}
