import { useState } from "react";
import { type AutomergeUrl, isValidAutomergeUrl } from "@automerge/react";
import { setRootDocUrl } from "../rootDoc.client";
import { Button } from "./button";
import { Input } from "./input";

interface SyncControlsProps {
  docUrl: AutomergeUrl;
}

export const SyncControls: React.FC<SyncControlsProps> = ({ docUrl }) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [error, setError] = useState("");

  const handleExport = () => {
    navigator.clipboard.writeText(docUrl);
  };

  const handleImport = () => {
    if (!isValidAutomergeUrl(importUrl)) {
      setError("Invalid Automerge URL");
      return;
    }

    setRootDocUrl(importUrl);
    window.location.reload();
  };

  const closeDialog = () => {
    setShowImportDialog(false);
    setImportUrl("");
    setError("");
  };

  return (
    <div className="flex flex-col gap-2">
      <Button className="text-sm justify-start" onClick={handleExport}>
        Kopírovat klíč
      </Button>
      <Button
        className="text-sm justify-start"
        onClick={() => setShowImportDialog(true)}
      >
        Importovat klíč
      </Button>

      {showImportDialog && (
        <dialog open className="flex bg-neutral-100 flex-col gap-2">
          <article>
            <header>
              <h3>Import your account token</h3>
            </header>
            <Input
              type="text"
              value={importUrl}
              onChange={(e) => {
                setImportUrl(e.target.value);
                setError("");
              }}
              placeholder="Paste your account token URL here"
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <footer className="flex gap-2">
              <Button onClick={handleImport}>Import</Button>
              <Button onClick={closeDialog}>Cancel</Button>
            </footer>
          </article>
        </dialog>
      )}
    </div>
  );
};
