import { type ReactNode, createContext, useContext, useState } from "react";

type DocumentSidebarContextType = {
  showDocumentSidebar: boolean;
  setShowDocumentSidebar: (value: boolean) => void;
};

const DocumentSidebarContext = createContext<
  DocumentSidebarContextType | undefined
>(undefined);

export const DocumentSidebarProvider = ({
  showDocumentSidebarDefault = true,
  children,
}: {
  showDocumentSidebarDefault?: boolean;
  children: ReactNode;
}) => {
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(
    showDocumentSidebarDefault,
  );

  return (
    <DocumentSidebarContext.Provider
      value={{
        showDocumentSidebar,
        setShowDocumentSidebar,
      }}
    >
      {children}
    </DocumentSidebarContext.Provider>
  );
};

export const useDocumentSidebar = () => {
  const context = useContext(DocumentSidebarContext);
  if (!context) {
    throw new Error("useDocumentSidebar must be used within VerifierProvider");
  }
  return context;
};
