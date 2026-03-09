import type { CardSource } from "schema/verifier";
import { Input } from "./input";
import { ExternalLink } from "lucide-react";
import { SourceTypeSelect } from "./source-type-select";
import { useVerifier } from "hooks/verifier-context";
import { SourceVerificationAnalysis } from "./source-verification-analysis";

export function SourceEditor({
  blockId,
  statementId,
  sourceId,
  sourceIndex,
  source,
}: {
  blockId: string;
  statementId: string;
  sourceId: string;
  sourceIndex: number;
  source: CardSource;
}) {
  const { setSourceType } = useVerifier();
  return (
    <div key={sourceIndex} className="mb-10 flex-1 animate-in fade-in">
      <div className="min-w-md flex-1">
        <div className="text-neutral-500 text-sm mb-1 font-mono">Zdroj</div>
        <div className="mb-2 rounded-lg flex bg-white flex-col">
          <Input
            value={source.name ?? ""}
            className="h-8! text-sm border-none px-2!"
            placeholder="Název zdroje"
          />{" "}
          <div className="flex">
            <Input
              value={source.url ?? ""}
              className="h-8! text-sm border-none px-2!"
              placeholder="URL Zdroje"
            />
            {source.url && (
              <a
                href={source.url ?? ""}
                target="_blank"
                className="h-8 shrink-0 flex gap-2 text-sm text-neutral-500 hover:text-neutral-900 py-1.5 pl-4 pr-4"
              >
                <span>Přejít na zdroj</span>
                <ExternalLink className="size-4 mt-0.5" />
              </a>
            )}
          </div>
          <div className="flex">
            <SourceTypeSelect
              value={source.type}
              onValueChange={(value) =>
                setSourceType(blockId, statementId, sourceId, value)
              }
            />
          </div>
        </div>
        {/*<div className="flex">
          <div className="mx-auto"></div>
          <Button className="text-sm h-9!">
            <Sparkle className="size-4 mr-1.5 -ml-0.5" /> Zkontrolovat
          </Button>
          </div>*/}
      </div>
      <div className="pl-12 mt-2 flex-1">
        <div className="rounded-xl mt-2 overflow-hidden">
          <SourceVerificationAnalysis source={source} />
        </div>
      </div>
    </div>
  );
}
