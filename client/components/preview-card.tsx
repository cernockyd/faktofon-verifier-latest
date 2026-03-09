import { Braces, Eye } from "lucide-react";
import { useState } from "react";
import type { Card } from "schema/verifier";
import { Toggle } from "./toggle";

export default function PreviewCard({ card }: { card: Card }) {
  const [mode, setMode] = useState<"json" | "preview">("preview");
  if (mode === "json")
    return (
      <div>
        <Toggle
          onClick={() => setMode("preview")}
          className="fixed top-2 right-2"
        >
          <Eye className="size-5" />
        </Toggle>
        <code className="h-screen block text-xs w-150 whitespace-pre-wrap">
          {JSON.stringify(card, null, 2)}
        </code>
      </div>
    );
  return (
    <div className="max-w-150 mx-auto px-3 py-10">
      <Toggle onClick={() => setMode("json")} className="fixed top-2 right-2">
        <Braces className="size-5" />
      </Toggle>
      <div className="font-semibold text-3xl mb-4 text-[#651c6a]">
        {card.title}
      </div>
      <div className="flex mb-4">
        <span className="text-nowrap mr-2">Témata karty:</span>
        <div className="flex flex-wrap gap-1">
          {card.topics.map((topic, index) => (
            <span
              key={index}
              className="inline-block text-nowrap bg-fuchsia-200 rounded-md px-2"
            >
              {topic.value}
            </span>
          ))}
        </div>
      </div>
      {card.blocks.order?.map((blockId, index) => {
        const block = card.blocks.record[blockId];
        const firstStatement =
          block.statements.record[block.statements.order[0]];

        return (
          <div
            key={index}
            className="border border-neutral-200 rounded-2xl overflow-hidden mb-4"
          >
            <div className="bg-blue-50 rounded-t-2xl">
              <div className="px-8 py-4">
                {block.statements.order.length && (
                  <p className="text-lg font-semibold text-neutral-900 mb-4">
                    <span className="text-lg mr-2">{firstStatement.emoji}</span>
                    {firstStatement.text}
                  </p>
                )}
                <p className="text-base text-neutral-900">
                  {block.statements.order
                    .slice(1)
                    ?.map((statementId, index) => {
                      const statement = block.statements.record[statementId];
                      return (
                        <span key={index} className="">
                          {statement.text}{" "}
                        </span>
                      );
                    })}
                </p>
              </div>
              <div className="mt-2 bg-purple-50 px-8 py-4">
                {block.statements?.order.map((statementId, index) => {
                  const statement = block.statements.record[statementId];
                  return (
                    <ul
                      key={index}
                      className="text-xs text-fuchsia-900 list-disc leading-tight"
                    >
                      {statement.sources?.order.map((sourceId, index) => {
                        const source = statement.sources!.record[sourceId];
                        return (
                          <li key={index} className="mb-1">
                            {source.url !== null && (
                              <a href={source.url} className="hover:underline">
                                {source.url}
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
