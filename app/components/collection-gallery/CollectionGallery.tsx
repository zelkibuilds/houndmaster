import type { Collection, CollectionAnalysis } from "~/types/magic-eden";
import type { ContractStatus } from "~/types/block-explorer";
import React, { useMemo, useState } from "react";
import { CollectionCard } from "../collection-card/Card";
import type { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import type { Chain } from "~/config/chains";
import { useParams } from "react-router";
import { getContractData } from "~/lib/requests/api/contract-data";
import { getExplorerUrl } from "~/components/collection-card/helpers";
import { analyzeMintRevenueForContract } from "~/lib/requests/api/on-chain-analysis";
import type { MintAnalysisResult } from "~/lib/requests/api/on-chain-analysis";

interface ContractBalanceTableProps {
  contracts: ContractStatus[];
  chain: Chain;
  onBack: () => void;
  contractToCollection: Map<string, CollectionAnalysis>;
}

function formatSourceCode(sourceCode: string | undefined): string {
  if (!sourceCode) return "Source code not available";
  try {
    return JSON.stringify(JSON.parse(sourceCode), null, 2);
  } catch {
    return sourceCode;
  }
}

interface WebsiteAnalysis {
  project_description: string;
  roadmap: string | null;
  services_analysis: string;
  confidence: "high" | "medium" | "low";
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WebsiteAnalysis;
}

function AnalysisModal({ isOpen, onClose, analysis }: AnalysisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-purple-900/90 border-2 border-purple-500/50 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-medieval text-orange-300">
            Project Analysis
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-300 hover:text-orange-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-orange-300 font-medium mb-2">
              Project Description
            </h4>
            <p className="text-purple-200">{analysis.project_description}</p>
          </div>
          {analysis.roadmap && (
            <div>
              <h4 className="text-orange-300 font-medium mb-2">Roadmap</h4>
              <p className="text-purple-200">{analysis.roadmap}</p>
            </div>
          )}
          <div>
            <h4 className="text-orange-300 font-medium mb-2">
              Recommended Services
            </h4>
            <p className="text-purple-200">{analysis.services_analysis}</p>
          </div>
          <div className="text-sm text-purple-300/70">
            Analysis Confidence: {analysis.confidence}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractBalanceTable({
  contracts,
  chain,
  onBack,
  contractToCollection,
}: ContractBalanceTableProps) {
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<
    Record<string, MintAnalysisResult>
  >({});
  const [analyzingContracts, setAnalyzingContracts] = useState<Set<string>>(
    new Set()
  );
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    isOpen: boolean;
    analysis: WebsiteAnalysis | null;
  }>({
    isOpen: false,
    analysis: null,
  });

  // Split contracts into three categories based on analysis results
  const { pending, analyzed, failed } = useMemo(() => {
    const pending: typeof contracts = [];
    const analyzed: typeof contracts = [];
    const failed: typeof contracts = [];

    for (const contract of contracts) {
      const result = analysisResults[contract.address];
      if (analyzingContracts.has(contract.address)) {
        pending.push(contract);
      } else if (!result) {
        pending.push(contract);
      } else if (result?.totalRaised && result.confidence !== "low") {
        analyzed.push(contract);
      } else if (result) {
        failed.push(contract);
      }
    }

    return { pending, analyzed, failed };
  }, [contracts, analysisResults, analyzingContracts]);

  function formatBalance(balanceWei: string | undefined): string {
    if (!balanceWei) return "0.0000";
    const balanceEth = Number(balanceWei) / 1e18;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 18,
      useGrouping: true,
    }).format(balanceEth);
  }

  function formatWeiToEth(weiAmount: string | null): string {
    if (!weiAmount) return "Could not determine";
    const wei = BigInt(weiAmount);
    const eth = Number(wei) / 1e18;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
      useGrouping: true,
    }).format(eth);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  const analyzeContract = async (address: string) => {
    setAnalyzingContracts((prev) => new Set(prev).add(address));
    try {
      const collection = contractToCollection.get(address);
      const result = await analyzeMintRevenueForContract({
        address,
        chain,
        websiteUrl: collection?.externalUrl,
      });
      setAnalysisResults((prev) => ({ ...prev, [address]: result }));
    } catch (error) {
      console.error("Failed to analyze contract:", error);
    } finally {
      setAnalyzingContracts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  };

  const analyzeAllContracts = async () => {
    const addresses = contracts.map((c) => c.address);
    addresses.forEach(analyzeContract);
  };

  const renderContractTable = (tableContracts: typeof contracts) => (
    <table className="min-w-full divide-y divide-purple-500/30">
      <thead className="bg-purple-900/30">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Contract
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Collection
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Balance
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Mint Analysis
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Project Analysis
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-purple-500/30 bg-purple-900/20">
        {tableContracts.map((contract) => (
          <React.Fragment key={contract.address}>
            <tr className="hover:bg-purple-800/30 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <a
                  href={getExplorerUrl(chain, contract.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {contract.address}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                {contractToCollection.get(contract.address)?.name || "Unknown"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                {formatBalance(contract.balance)} ETH
              </td>
              <td className="px-6 py-4">
                {analyzingContracts.has(contract.address) ? (
                  <div className="flex items-center gap-2 text-orange-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
                    <span>Analyzing...</span>
                  </div>
                ) : analysisResults[contract.address] ? (
                  (() => {
                    const result = analysisResults[contract.address];
                    return (
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-orange-300">
                          {result.totalRaised
                            ? `${formatWeiToEth(result.totalRaised)} ${
                                result.currency
                              }`
                            : "Could not determine"}
                        </div>
                        <div className="text-sm text-purple-300">
                          Confidence: {result.confidence}
                        </div>
                        {result.mintCount && (
                          <div className="text-sm text-purple-300">
                            Total Mints: {result.mintCount}
                          </div>
                        )}
                        {result.averageMintPrice && (
                          <div className="text-sm text-purple-300">
                            Avg Price: {formatWeiToEth(result.averageMintPrice)}{" "}
                            {result.currency}
                          </div>
                        )}
                        {result.missingInfo && (
                          <div className="text-sm text-orange-400">
                            Missing: {result.missingInfo.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <button
                    type="button"
                    onClick={() => analyzeContract(contract.address)}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Analyze
                  </button>
                )}
              </td>
              <td className="px-6 py-4">
                {analyzingContracts.has(contract.address) ? (
                  <div className="flex items-center gap-2 text-orange-300">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
                    <span>Analyzing...</span>
                  </div>
                ) : analysisResults[contract.address]?.websiteAnalysis
                    ?.project_description ===
                    "No content available for analysis" ||
                  analysisResults[contract.address]?.websiteAnalysis
                    ?.project_description === "Failed to analyze content" ? (
                  <div className="text-sm text-purple-300/70">---</div>
                ) : analysisResults[contract.address]?.websiteAnalysis ? (
                  <button
                    type="button"
                    onClick={() => {
                      const analysis =
                        analysisResults[contract.address]?.websiteAnalysis;
                      if (analysis) {
                        setSelectedAnalysis({
                          isOpen: true,
                          analysis,
                        });
                      }
                    }}
                    className="px-3 py-1 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 rounded border border-purple-600/50 transition-colors"
                  >
                    View Analysis
                  </button>
                ) : (
                  <div className="text-sm text-purple-300/70">---</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedContract(
                      expandedContract === contract.address
                        ? null
                        : contract.address
                    )
                  }
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {expandedContract === contract.address
                    ? "Hide Source"
                    : "View Source"}
                </button>
              </td>
            </tr>
            {expandedContract === contract.address && (
              <tr>
                <td colSpan={5} className="px-6 py-4 bg-purple-950/50">
                  <div className="relative">
                    <pre className="text-sm overflow-x-auto bg-purple-900/30 p-4 rounded text-purple-200">
                      {formatSourceCode(contract.sourceCode)}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(formatSourceCode(contract.sourceCode))
                      }
                      className="absolute top-2 right-2 px-3 py-1 text-sm bg-purple-800 text-purple-200 border border-purple-600 rounded shadow-sm hover:bg-purple-700"
                    >
                      Copy
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="text-orange-400 hover:text-orange-300"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={analyzeAllContracts}
          className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 disabled:opacity-50 border-2 border-orange-500/50"
          disabled={contracts.length === 0}
        >
          Analyze Mint Revenue
        </button>
      </div>

      {pending.length > 0 && (
        <div className="w-full">
          <h2 className="text-xl font-medieval text-orange-300 mb-4 flex items-center gap-3">
            Contracts Pending Analysis
            {analyzingContracts.size > 0 && (
              <div className="flex items-center gap-2 text-orange-300 text-base">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
                <span>Analyzing {analyzingContracts.size} contracts...</span>
              </div>
            )}
          </h2>
          {renderContractTable(pending)}
        </div>
      )}

      {analyzed.length > 0 && (
        <div className="w-full">
          <h2 className="text-xl font-medieval text-orange-300 mb-4">
            Analyzed Contracts
          </h2>
          {renderContractTable(analyzed)}
        </div>
      )}

      {failed.length > 0 && (
        <div className="w-full opacity-75">
          <h2 className="text-xl font-medieval text-orange-300 mb-4">
            Analysis Failed
          </h2>
          {renderContractTable(failed)}
        </div>
      )}

      {selectedAnalysis.analysis && (
        <AnalysisModal
          isOpen={selectedAnalysis.isOpen}
          onClose={() => setSelectedAnalysis({ isOpen: false, analysis: null })}
          analysis={selectedAnalysis.analysis}
        />
      )}
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
  const [showOnlyWithWebsite, setShowOnlyWithWebsite] = useState(false);

  const filteredRecentCollections = useMemo(() => {
    if (!showOnlyWithWebsite) return recentCollections;
    return recentCollections?.filter((collection) => collection.externalUrl);
  }, [recentCollections, showOnlyWithWebsite]);

  const filteredOldCollections = useMemo(() => {
    if (!showOnlyWithWebsite) return oldCollections;
    return oldCollections?.filter((collection) => collection.externalUrl);
  }, [oldCollections, showOnlyWithWebsite]);

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
      setContractData(data.results);
      setRequestStatus("success");
    } catch (error) {
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

  if (contractData.length > 0) {
    return (
      <ContractBalanceTable
        contracts={contractData}
        chain={chain}
        onBack={resetState}
        contractToCollection={contractToCollection}
      />
    );
  }

  return (
    <>
      <div className="space-y-4 mb-6">
        <h1 className="text-4xl font-medieval text-orange-400 tracking-wider">
          Recently Launched NFT Collections
        </h1>
        <div className="flex gap-4 flex-wrap">
          <button
            type="button"
            onClick={clearSelection}
            disabled={isSelectionEmpty}
            className={`min-w-[210px] px-4 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                isSelectionEmpty
                  ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
              }
            `}
          >
            {isSelectionEmpty
              ? "Clear Selection"
              : `Clear Selection (${selectedContracts.size})`}
          </button>
          <button
            type="button"
            onClick={releaseTheHounds}
            disabled={isSelectionEmpty}
            className={`min-w-[200px] px-6 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                isSelectionEmpty
                  ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
              }
            `}
          >
            Release the Hounds
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyWithWebsite((prev) => !prev)}
            className={`min-w-[200px] px-4 py-2 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                showOnlyWithWebsite
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                  : "bg-purple-900/30 text-purple-300/70 border-purple-700/50"
              } hover:bg-orange-500/30 hover:text-orange-200 hover:border-orange-400`}
          >
            {showOnlyWithWebsite
              ? "Show All Collections"
              : "Show Only With Websites"}
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
            View Recent Collections ({filteredRecentCollections?.length})
          </span>
        </summary>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecentCollections?.map((collection) => (
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
            View Older Collections ({filteredOldCollections?.length})
          </span>
        </summary>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80">
          {filteredOldCollections?.map((collection) => (
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
