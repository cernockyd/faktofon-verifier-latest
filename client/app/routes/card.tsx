import type { Route } from "./+types/home";
import { Suspense, useEffect, useState } from "react";
import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/react";
import App from "components/app";
import { canUseDOM } from "utils/browser.client";
import { VerifierProvider } from "hooks/verifier-context";
import { CardEditor } from "components/editor";
import { useNavigate } from "react-router";
import { useHash } from "react-use";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Faktofon Verifier" },
    { name: "description", content: "Pomucka vytvareni karet" },
  ];
}

export default function Home() {
  const [hash, setHash] = useHash();
  let navigate = useNavigate();
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const cleanHash = "automerge:" + hash.slice(1); // remove the leading '#'
  const selectedDocUrl =
    cleanHash && isValidAutomergeUrl(cleanHash)
      ? (cleanHash as AutomergeUrl)
      : null;

  return (
    <div className="flex h-[calc(100vh)] w-full">
      <Suspense fallback={<p>Loading</p>}>
        {selectedDocUrl ? (
          <>
            <VerifierProvider docUrl={selectedDocUrl}>
              <CardEditor />
            </VerifierProvider>
          </>
        ) : (
          <p className="text-lg text-center self-center mx-auto w-auto text-neutral-600">
            Vytvořte novou kartu
            <br />
            nebo vyberte kartu k editaci.
          </p>
        )}
      </Suspense>
    </div>
  );
}
