import type { CardSource } from "schema/verifier";
import { formatDate } from "date-fns";
import { cs } from "date-fns/locale";
import {
  DataTable,
  formatPercentage,
  type TableKeys,
  StatusSummary,
} from "./data-table";
import { useVerifier } from "hooks/verifier-context";

const functionKeys: Record<string, string> = {
  reference: "reference",
  research: "výzkum",
  instructional: "instrukční",
  news: "zpravodajství",
  opinion: "názor",
  promotion: "reklama",
  entertainment: "zábava",
};

const originKeys: Record<string, string> = {
  academic: "akademický",
  professional: "profesionální",
  general: "obecný",
  governmental: "státní/institucionální",
  popular: "populární",
  other: "jiné",
};

const levelKeys: Record<string, string> = {
  primary: "primární",
  secondary: "sekundární",
  terciary: "terciální",
};

const status = {
  supports: {
    state: "success",
    text: "Zdroj podporuje tvrzení",
  },
  not_supports: {
    state: "error",
    text: "Zdroj nedokládá tvrzení",
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
  source_implies_proposition_truthful: {
    name: "Zdroj dokládá tvrzení",
    format: formatPercentage,
  },
  source_currency: {
    name: "Aktuálnost",
    format: formatPercentage,
  },
  source_point_of_view: { name: "Faktičnost", format: formatPercentage },
  source_reliability: { name: "Spolehlivost", format: formatPercentage },
  source_function: {
    name: "Funkce",
    format: (value: string) => functionKeys[value],
  },
  source_level: { name: "Úroveň", format: (value) => levelKeys[value] },
  source_origin: { name: "Původ", format: (value) => originKeys[value] },
  source_title: { name: "Titulek", format: (value) => value },
  source_proof_near_exact_substrings: {
    name: "Důkaz",
    format: (value) => value,
  },
  source_proof_paraphrase: {
    name: "Parafráze důkazu",
    format: (value) => value,
  },
  source_published_at: {
    name: "Publikováno",
    format: (value: string) => formatDate(value, "d. M. y", { locale: cs }),
  },
};

export function SourceVerificationAnalysis({
  // blockId,
  // statementId,
  // sourceId,
  // sourceIndex,
  source,
}: {
  // blockId: string;
  // statementId: string;
  // sourceId: string;
  // sourceIndex: number;
  source: CardSource;
}) {
  const { setSourceType } = useVerifier();
  return (
    <DataTable
      data={source.verification}
      tableKeys={tableKeys}
      triggerName="Analýza zdroje"
    />
  );
}
