import type { CardStatement } from "schema/verifier";
import { DataTable, StatusSummary, type TableKeys } from "./data-table";

const sourceLevels = {
  primary: "Primární",
  secondary: "Sekundární",
  terciary: "Terciální",
};

const status = {
  supported: {
    state: "success",
    text: "Podloženo",
  },
  not_supported: {
    state: "error",
    text: "Nepodloženo",
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
  sources_statistics: {
    name: "Statistika zdrojů",
    format: (sources_statistics) => (
      <ul>
        {sources_statistics != null &&
          Object.keys(sources_statistics).map((key) => (
            <li>
              <span className="inline-block min-w-22 mr-1">
                {sourceLevels[key as keyof typeof sourceLevels]}:
              </span>
              {sources_statistics[key]}
            </li>
          ))}
      </ul>
    ),
  },
};

export function StatementVerificationAnalysis({
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
      data={statement.verification_analysis}
      tableKeys={tableKeys}
      triggerName="Podloženost tvrzení"
    />
  );
}
