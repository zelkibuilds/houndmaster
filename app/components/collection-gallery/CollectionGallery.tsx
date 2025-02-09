import type { Collection, CollectionAnalysis } from "~/types/magic-eden";
import type { ContractStatus } from "~/types/block-explorer";
import { useMemo, useState } from "react";
import { CollectionCard } from "../collection-card/Card";
import type { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import type { Chain } from "~/config/chains";
import { useParams } from "react-router";
import { getContractData } from "~/lib/requests/api/contract-data";

interface ContractBalanceTableProps {
  contracts: ContractStatus[];
  chain: Chain;
  onBack: () => void;
}

function ContractBalanceTable({
  contracts,
  chain,
  onBack,
}: ContractBalanceTableProps) {
  function formatBalance(balanceWei: string | undefined): string {
    if (!balanceWei) return "0.0000";

    // Convert wei to ETH (18 decimals)
    const balanceEth = Number(balanceWei) / 1e18;

    // Format with full precision and thousand separators
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 18,
      useGrouping: true,
    }).format(balanceEth);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medieval text-orange-400">
          Contract Balances
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
            bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 
            hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
        >
          Return to the Hunt
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-orange-500/20 bg-[#1A0B26]">
        <table className="min-w-full divide-y divide-orange-500/20">
          <thead className="bg-orange-500/10">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medieval text-orange-300"
              >
                Contract Address
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-sm font-medieval text-orange-300"
              >
                Balance ({chain === "apechain" ? "APE" : "ETH"})
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-500/20">
            {contracts.map((contract) => (
              <tr key={contract.address} className="hover:bg-orange-500/5">
                <td className="px-6 py-4 text-sm font-mono text-purple-200">
                  {contract.address}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medieval text-purple-200">
                  {formatBalance(contract.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  const { chain } = useParams() as { chain: Chain };
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [contractData, setContractData] = useState<ContractStatus[]>([]);

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

  const resetState = () => {
    setContractData([]);
    setRequestStatus("idle");
    clearSelection();
  };

  const releaseTheHounds = async () => {
    setIsLoading(true);
    setRequestStatus("idle");
    try {
      const data = await getContractData({
        contractAddresses: Array.from(selectedContracts),
        chain,
      });
      console.log("Contract Data Response:", data);
      setContractData(data.results);
      setRequestStatus("success");
    } catch (error) {
      console.error("Contract Data Error:", error);
      setRequestStatus("error");
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-2xl font-medieval text-orange-400 animate-pulse">
          The Hounds are on the Trails...
        </div>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show contract data table if we have results
  if (contractData.length > 0) {
    return (
      <ContractBalanceTable
        contracts={contractData}
        chain={chain}
        onBack={resetState}
      />
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-medieval text-orange-400 tracking-wider">
          Recently Launched NFT Collections
        </h1>
        <div className="flex gap-4">
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
          <button
            type="button"
            onClick={releaseTheHounds}
            disabled={isSelectionEmpty}
            className={`px-6 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                isSelectionEmpty
                  ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
              }
            `}
          >
            Release the Hounds
          </button>
        </div>
      </div>

      {requestStatus !== "idle" && (
        <div
          className={`mb-6 p-4 rounded-lg font-medieval text-lg ${
            requestStatus === "success"
              ? "bg-green-500/20 text-green-300 border-2 border-green-500/50"
              : "bg-red-500/20 text-red-300 border-2 border-red-500/50"
          }`}
        >
          {requestStatus === "success"
            ? "The Hounds have returned successfully with their findings!"
            : "The Hounds encountered some trouble on their journey..."}
        </div>
      )}

      <details className="mt-8 group" open>
        <summary className="cursor-pointer text-xl font-medieval mb-4 text-purple-300/90 hover:text-orange-300 transition-colors duration-200 flex items-center gap-2">
          <span className="text-orange-500/70 group-open:rotate-90 transition-transform duration-200">
            ▶
          </span>
          <span className="tracking-wide">
            View Recent Collections ({recentCollections?.length})
          </span>
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
              chain={chain}
            />
          ))}
        </div>
      </details>

      <details className="mt-8 group">
        <summary className="cursor-pointer text-xl font-medieval mb-4 text-purple-300/90 hover:text-orange-300 transition-colors duration-200 flex items-center gap-2">
          <span className="text-orange-500/70 group-open:rotate-90 transition-transform duration-200">
            ▶
          </span>
          <span className="tracking-wide">
            View Older Collections ({oldCollections?.length})
          </span>
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
              chain={chain}
            />
          ))}
        </div>
      </details>
    </>
  );
}
