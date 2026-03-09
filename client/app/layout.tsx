import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import { type AutomergeUrl } from "@automerge/react";
import { canUseDOM } from "utils/browser.client";
import { DocumentSidebarProvider } from "hooks/document-sidebar-context";

export default function Layout() {
  const [mounted, setMounted] = useState(false);
  const [handle, setHandle] = useState<AutomergeUrl | null>(null);
  useEffect(() => {
    setMounted(true);
    if (canUseDOM) {
      setHandle(window.handle.url);
    }
  }, []);

  if (!mounted || !handle) {
    return;
  }

  return (
    <DocumentSidebarProvider>
      <Outlet />
    </DocumentSidebarProvider>
  );
}
