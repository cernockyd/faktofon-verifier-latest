import { useDocument, type AutomergeUrl } from "@automerge/react";
import PreviewCard from "./preview-card";
import type { Card } from "schema/verifier";
import { useVerifier } from "hooks/verifier-context";

export const Preview: React.FC = () => {
  const { card } = useVerifier();

  return <PreviewCard card={card} />;
};
