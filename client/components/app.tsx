import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/react";
import { CardEditor } from "./editor";
import { DocumentList } from "./document-list";
import { useHash } from "react-use";
//import { useNavigate } from "react-router";
import { Toggle } from "./toggle";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { VerifierProvider } from "hooks/verifier-context";
import { useDocumentSidebar } from "hooks/document-sidebar-context";

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [hash, setHash] = useHash();
  //let navigate = useNavigate();
  const { showDocumentSidebar, setShowDocumentSidebar } = useDocumentSidebar();
  const cleanHash = "automerge:" + hash.slice(1); // remove the leading '#'
  const selectedDocUrl =
    cleanHash && isValidAutomergeUrl(cleanHash)
      ? (cleanHash as AutomergeUrl)
      : null;

  return (
    <div className="flex w-full h-screen">
      {showDocumentSidebar && (
        <div className="flex flex-col bg-neutral-100 border-r border-neutral-200">
          <div className="flex items-center justify-end mb-2 p-1.5 border-b border-neutral-200">
            <div className="font-medium mr-auto ml-3">Verifier</div>
            {selectedDocUrl ? (
              <Toggle
                pressed={showDocumentSidebar}
                onPressedChange={(value) =>
                  setShowDocumentSidebar(!showDocumentSidebar)
                }
                render={(props, state) => {
                  if (state.pressed) {
                    return (
                      <button type="button" {...props}>
                        <PanelLeftClose className="size-5" />
                      </button>
                    );
                  }
                  return (
                    <button type="button" {...props}>
                      <PanelLeftOpen className="size-5" />
                    </button>
                  );
                }}
              />
            ) : (
              <div className="size-[35px]"></div>
            )}
          </div>
          <div className="p-3 flex flex-col">
            {showDocumentSidebar && (
              <DocumentList
                docUrl={docUrl}
                onSelectDocument={(url) => {
                  if (url) {
                    setHash(url.split("automerge:")[1]);
                  } else {
                    setHash("");
                  }
                }}
                selectedDocument={selectedDocUrl}
              />
            )}
          </div>
        </div>
      )}
      <div className="flex w-full">
        {selectedDocUrl ? (
          <>
            <VerifierProvider key={selectedDocUrl} docUrl={selectedDocUrl}>
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
      </div>
    </div>
  );
}

export default App;
