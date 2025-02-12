import { createContext, useContext, useState } from "react";

type CollectionSelectionContextType = {
  selectedCollections: Set<string>;
  toggleCollection: (contractAddress: string) => void;
  clearSelection: () => void;
  showOnlyWithWebsites: boolean;
  setShowOnlyWithWebsites: (value: boolean) => void;
};

const CollectionSelectionContext =
  createContext<CollectionSelectionContextType | null>(null);

export function useCollectionSelection() {
  const context = useContext(CollectionSelectionContext);
  if (!context) {
    throw new Error(
      "useCollectionSelection must be used within CollectionSelectionProvider"
    );
  }
  return context;
}

export function CollectionSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );
  const [showOnlyWithWebsites, setShowOnlyWithWebsites] = useState(true);

  const toggleCollection = (contractAddress: string) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(contractAddress)) {
        next.delete(contractAddress);
      } else {
        next.add(contractAddress);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCollections(new Set());
  };

  return (
    <CollectionSelectionContext.Provider
      value={{
        selectedCollections,
        toggleCollection,
        clearSelection,
        showOnlyWithWebsites,
        setShowOnlyWithWebsites,
      }}
    >
      {children}
    </CollectionSelectionContext.Provider>
  );
}
