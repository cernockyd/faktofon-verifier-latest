import { startTransition, StrictMode, Suspense } from "react";
import { HydratedRouter } from "react-router/dom";
import { hydrateRoot } from "react-dom/client";
import {
  Repo,
  BroadcastChannelNetworkAdapter,
  WebSocketClientAdapter,
  IndexedDBStorageAdapter,
  RepoContext,
  DocHandle,
} from "@automerge/react";
import { getOrCreateRoot, type RootDocument } from "rootDoc.client";

console.log("ENTRY CLIENT LOADED");

// Add the repo to the global window object so it can be accessed in the browser console
// This is useful for debugging and testing purposes.
declare global {
  interface Window {
    repo: Repo;
    // We also add the handle to the global window object for debugging
    handle: DocHandle<RootDocument>;
  }
}

const repo = new Repo({
  network: [
    new BroadcastChannelNetworkAdapter(),
    new WebSocketClientAdapter("wss://sync.automerge.org"),
  ],
  storage: new IndexedDBStorageAdapter(),
});

const rootDocUrl = getOrCreateRoot(repo);
const handle = (await repo.find(rootDocUrl)) as DocHandle<RootDocument>;

window.handle = handle;

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RepoContext.Provider value={repo}>
        <HydratedRouter />
      </RepoContext.Provider>
    </StrictMode>,
  );
});
