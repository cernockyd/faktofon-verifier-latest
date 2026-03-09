import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import { type AutomergeUrl } from "@automerge/react";
import App from "components/app";
import { canUseDOM } from "utils/browser.client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Faktofon Verifier" },
    { name: "description", content: "Pomucka vytvareni karet" },
  ];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [handle, setHandle] = useState<AutomergeUrl | null>(null);
  useEffect(() => {
    setMounted(true);
    if (canUseDOM) {
      setHandle(window.handle.url);
    }
  }, []);

  if (!mounted || !handle) {
    return <main />;
  }

  return <main>{handle && <App docUrl={handle} />}</main>;
}
