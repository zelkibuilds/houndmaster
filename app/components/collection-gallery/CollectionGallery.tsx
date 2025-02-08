import type { Collection, CollectionAnalysis } from "~/types/magic-eden";
import { useMemo, useState } from "react";
import { CollectionCard } from "../collection-card/Card";
import type { MagicEdenAdapter } from "~/adapters/marketplaces/magic-eden";

interface CollectionGalleryProps {
  recentCollections?: Collection[];
  oldCollections?: Collection[];
  magicEdenAdapter: MagicEdenAdapter;
}

export function CollectionGallery({
  recentCollections,
  oldCollections,
  magicEdenAdapter,
}: CollectionGalleryProps) {
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(
    new Set()
  );

  const handleSelect = (contractAddress: string) => {
    setSelectedContracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contractAddress)) {
        newSet.delete(contractAddress);
      } else {
        newSet.add(contractAddress);
      }
      return newSet;
    });
  };

  const isSelectionEmpty = selectedContracts.size === 0;

  const clearSelection = () => {
    setSelectedContracts(new Set());
  };

  // Map to store contract -> collection mapping
  const contractToCollection = useMemo(() => {
    const map = new Map<string, CollectionAnalysis>();

    const addToMap = (collection: Collection) => {
      if (collection.primaryContract) {
        map.set(
          collection.primaryContract,
          magicEdenAdapter.formatCollectionData(collection)
        );
      }
    };

    recentCollections?.forEach(addToMap);
    oldCollections?.forEach(addToMap);

    return map;
  }, [recentCollections, oldCollections, magicEdenAdapter]);

  // Helper to get selected collections
  const selectedCollections = useMemo(
    () =>
      Array.from(selectedContracts)
        .map((contract) => contractToCollection.get(contract))
        .filter(
          (collection): collection is CollectionAnalysis =>
            collection !== undefined
        ),
    [selectedContracts, contractToCollection]
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-medieval text-orange-400 tracking-wider">
          Recently Launched NFT Collections
        </h1>
        <button
          type="button"
          onClick={clearSelection}
          disabled={isSelectionEmpty}
          className={`px-4 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
            ${
              isSelectionEmpty
                ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
            }
          `}
        >
          Clear Selection {!isSelectionEmpty && `(${selectedContracts.size})`}
        </button>
      </div>

      <details className="mt-8" open>
        <summary className="cursor-pointer text-xl font-semibold mb-4 text-gray-400 hover:text-gray-600">
          View Recent Collections ({recentCollections?.length})
        </summary>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentCollections?.map((collection) => (
            <CollectionCard
              key={collection.name}
              collection={magicEdenAdapter.formatCollectionData(collection)}
              isSelected={
                collection.primaryContract
                  ? selectedContracts.has(collection.primaryContract)
                  : false
              }
              onSelect={handleSelect}
            />
          ))}
        </div>
      </details>

      <details className="mt-8">
        <summary className="cursor-pointer text-xl font-semibold mb-4 text-gray-400 hover:text-gray-600">
          View Older Collections ({oldCollections?.length})
        </summary>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80">
          {oldCollections?.map((collection) => (
            <CollectionCard
              key={collection.name}
              collection={magicEdenAdapter.formatCollectionData(collection)}
              isSelected={
                collection.primaryContract
                  ? selectedContracts.has(collection.primaryContract)
                  : false
              }
              onSelect={handleSelect}
            />
          ))}
        </div>
      </details>
    </>
  );
}
