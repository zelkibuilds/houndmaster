import type { Collection, CollectionAnalysis } from "~/types/magic-eden";
import type { ContractStatus } from "~/types/block-explorer";
import { useMemo, useState, useEffect } from "react";
import { CollectionCard } from "../collection-card/Card";
import type { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import type { Chain } from "~/config/chains";
import { useParams } from "react-router";
import { getContractData } from "~/lib/requests/api/contract-data";
import { getExplorerUrl } from "~/components/collection-card/helpers";
import { analyzeMintRevenueForContract } from "~/lib/requests/api/on-chain-analysis";
import type { MintAnalysisResult } from "~/lib/requests/api/on-chain-analysis";
import { isValidExternalUrl } from "~/lib/validators/url";
import ReactMarkdown from "react-markdown";
import { CHAIN_TO_TOKEN } from "~/config/tokens";
import { useCollectionSelection } from "~/context/collection-selection";
import { assertChain } from "~/lib/type-guards/chains";
import { useAnalysisState } from "~/context/analysis-state";

interface ContractBalanceTableProps {
  contracts: ContractStatus[];
  chain: Chain;
  onBack: () => void;
  contractToCollection: Map<string, CollectionAnalysis>;
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
  websiteUrl?: string;
}

function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  websiteUrl,
}: AnalysisModalProps) {
  if (!isOpen) return null;

  // Process services text to handle the new format
  const formattedServices = analysis.services_analysis
    .split("\n")
    .filter((line) => line.trim()) // Remove empty lines
    .map((line) => line.trim())
    .join("\n"); // Remove extra spacing between services

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-purple-900/90 border-2 border-purple-500/50 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-medieval text-orange-300">
            Hound's Report
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-300 hover:text-orange-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-medieval text-orange-300 mb-3">
              Project Description
            </h4>
            <div className="prose prose-invert prose-orange max-w-none">
              <ReactMarkdown className="text-purple-100 whitespace-pre-wrap leading-relaxed">
                {analysis.project_description}
              </ReactMarkdown>
            </div>
          </div>
          {websiteUrl && (
            <div>
              <h4 className="text-lg font-medieval text-orange-300 mb-3">
                Project Website
              </h4>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 break-all"
              >
                {websiteUrl}
              </a>
            </div>
          )}
          {analysis.roadmap && (
            <div>
              <h4 className="text-lg font-medieval text-orange-300 mb-3">
                Roadmap
              </h4>
              <div className="prose prose-invert prose-orange max-w-none">
                <ReactMarkdown className="text-purple-100 whitespace-pre-wrap leading-relaxed">
                  {analysis.roadmap}
                </ReactMarkdown>
              </div>
            </div>
          )}
          <div>
            <h4 className="text-lg font-medieval text-orange-300 mb-3">
              Recommended Services
            </h4>
            <div className="prose prose-invert prose-orange max-w-none">
              <ReactMarkdown
                className="text-white whitespace-pre-wrap leading-relaxed"
                components={{
                  strong: ({ children }) => (
                    <span className="text-orange-300 font-bold">
                      {children}
                    </span>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                }}
              >
                {formattedServices}
              </ReactMarkdown>
            </div>
          </div>
          <div className="text-sm text-purple-300/70 pt-4 border-t border-purple-500/30">
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
  const [analysisResults, setAnalysisResults] = useState<
    Record<string, MintAnalysisResult>
  >({});
  const [analyzingContracts, setAnalyzingContracts] = useState<Set<string>>(
    new Set()
  );
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    isOpen: boolean;
    analysis: WebsiteAnalysis | null;
    websiteUrl?: string;
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
      } else {
        // Check if both analyses failed
        const mintAnalysisFailed =
          !result.totalRaised || result.confidence === "low";
        const websiteAnalysisFailed =
          !result.websiteAnalysis ||
          result.websiteAnalysis.project_description ===
            "No content available for analysis" ||
          result.websiteAnalysis.project_description ===
            "Failed to analyze content" ||
          result.websiteAnalysis.project_description.startsWith(
            "Failed to scrape"
          );

        if (mintAnalysisFailed && websiteAnalysisFailed) {
          failed.push(contract);
        } else {
          analyzed.push(contract);
        }
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
      // If it's a duplicate key error, try to fetch the existing analysis
      if (
        error instanceof Error &&
        error.message.includes("duplicate key value")
      ) {
        try {
          // Just retry the analysis - the server should handle returning existing data
          const result = await analyzeMintRevenueForContract({
            address,
            chain,
          });
          setAnalysisResults((prev) => ({ ...prev, [address]: result }));
        } catch (fetchError) {
          console.error("Failed to fetch existing analysis:", fetchError);
        }
      } else {
        console.error("Failed to analyze contract:", error);
      }
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

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  const renderContractTable = (tableContracts: typeof contracts) => (
    <table className="min-w-full divide-y divide-purple-500/30">
      <thead className="bg-purple-900/30">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Collection
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Contract
          </th>
          <th className="px-6 py-3 text-left text-xs font-medieval text-orange-300 uppercase tracking-wider">
            Website
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
        </tr>
      </thead>
      <tbody className="divide-y divide-purple-500/30 bg-purple-900/20">
        {tableContracts.map((contract) => {
          const collection = contractToCollection.get(contract.address);
          return (
            <tr
              key={contract.address}
              className="hover:bg-purple-800/30 transition-colors duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                {collection?.name || "Unknown"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <a
                  href={getExplorerUrl(chain, contract.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {shortenAddress(contract.address)}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {collection?.externalUrl ? (
                  <a
                    href={collection.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Visit
                  </a>
                ) : (
                  <span className="text-purple-300/50">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                {formatBalance(contract.balance)} {CHAIN_TO_TOKEN[chain]}
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
                  <div className="text-sm text-purple-300/70">---</div>
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
                    ?.project_description === "Failed to analyze content" ||
                  analysisResults[
                    contract.address
                  ]?.websiteAnalysis?.project_description.startsWith(
                    "Failed to scrape"
                  ) ? (
                  <div className="text-sm text-orange-400">
                    Failed to analyze website
                  </div>
                ) : analysisResults[contract.address]?.websiteAnalysis ? (
                  <button
                    type="button"
                    onClick={() => {
                      const analysis =
                        analysisResults[contract.address]?.websiteAnalysis;
                      const collection = contractToCollection.get(
                        contract.address
                      );
                      if (analysis) {
                        setSelectedAnalysis({
                          isOpen: true,
                          analysis,
                          websiteUrl: collection?.externalUrl,
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
            </tr>
          );
        })}
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
          className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-orange-500/50"
          disabled={contracts.length === 0 || analyzingContracts.size > 0}
        >
          {analyzingContracts.size > 0 ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
              <span>Analyzing...</span>
            </div>
          ) : (
            "Send Hounds to Investigate"
          )}
        </button>
      </div>

      {pending.length > 0 && (
        <div className="w-full">
          <h2 className="text-xl font-medieval text-orange-300 mb-4 flex items-center gap-3">
            Trails Awaiting Investigation
            {analyzingContracts.size > 0 && (
              <div className="flex items-center gap-2 text-orange-300 text-base">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400" />
                <span>
                  The Pack is Sniffing {analyzingContracts.size} Trails...
                </span>
              </div>
            )}
          </h2>
          {renderContractTable(pending)}
        </div>
      )}

      {analyzed.length > 0 && (
        <div className="w-full">
          <h2 className="text-xl font-medieval text-orange-300 mb-4">
            Successful Hunts
          </h2>
          {renderContractTable(analyzed)}
        </div>
      )}

      {failed.length > 0 && (
        <div className="w-full opacity-75">
          <h2 className="text-xl font-medieval text-orange-300 mb-4">
            Lost Trails
          </h2>
          {renderContractTable(failed)}
        </div>
      )}

      {selectedAnalysis.analysis && (
        <AnalysisModal
          isOpen={selectedAnalysis.isOpen}
          onClose={() => setSelectedAnalysis({ isOpen: false, analysis: null })}
          analysis={selectedAnalysis.analysis}
          websiteUrl={selectedAnalysis.websiteUrl}
        />
      )}
    </div>
  );
}

interface CollectionGalleryProps {
  recentCollections?: Collection[];
  oldCollections?: Collection[];
  magicEdenAdapter: MagicEdenAdapter;
  onShowingBalancesChange: (showing: boolean) => void;
}

export function CollectionGallery({
  recentCollections,
  oldCollections,
  magicEdenAdapter,
  onShowingBalancesChange,
}: CollectionGalleryProps) {
  const { chain } = useParams();
  assertChain(chain);

  const {
    selectedCollections,
    toggleCollection,
    showOnlyWithWebsites,
    clearSelection,
  } = useCollectionSelection();
  const { isAnalyzing, setIsAnalyzing, triggerAnalysis } = useAnalysisState();
  const [showingBalances, setShowingBalances] = useState(false);
  const [contractData, setContractData] = useState<ContractStatus[]>([]);

  useEffect(() => {
    onShowingBalancesChange(showingBalances);
  }, [showingBalances, onShowingBalancesChange]);

  useEffect(() => {
    if (isAnalyzing && !showingBalances) {
      const analyze = async () => {
        try {
          // First get the contract data
          const data = await getContractData({
            contractAddresses: Array.from(selectedCollections),
            chain,
          });
          setContractData(data.results);
          setShowingBalances(true);
        } catch (error) {
          console.error("Failed to release the hounds:", error);
          clearSelection(); // Clear selection on error
        } finally {
          setIsAnalyzing(false);
        }
      };
      analyze();
    }
  }, [
    isAnalyzing,
    chain,
    selectedCollections,
    showingBalances,
    setIsAnalyzing,
    clearSelection,
  ]);

  const handleReleaseHounds = () => {
    if (selectedCollections.size === 0) return;
    triggerAnalysis();
  };

  const filteredRecentCollections = useMemo(() => {
    if (!recentCollections) return [];
    return showOnlyWithWebsites
      ? recentCollections.filter((c) => isValidExternalUrl(c.externalUrl))
      : recentCollections;
  }, [recentCollections, showOnlyWithWebsites]);

  const filteredOldCollections = useMemo(() => {
    if (!oldCollections) return [];
    return showOnlyWithWebsites
      ? oldCollections.filter((c) => isValidExternalUrl(c.externalUrl))
      : oldCollections;
  }, [oldCollections, showOnlyWithWebsites]);

  const resetState = () => {
    setContractData([]);
    clearSelection();
    setShowingBalances(false);
    onShowingBalancesChange(false);
    setIsAnalyzing(false);
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

  const renderCollection = (collection: Collection) => {
    const formattedCollection =
      magicEdenAdapter.formatCollectionData(collection);
    return (
      <CollectionCard
        key={collection.primaryContract}
        collection={formattedCollection}
        isSelected={
          collection.primaryContract
            ? selectedCollections.has(collection.primaryContract)
            : false
        }
        onSelect={toggleCollection}
        chain={chain}
      />
    );
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-2xl font-medieval text-orange-400 animate-pulse">
          The Pack is Tracking {selectedCollections.size} Scents...
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
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-4xl font-medieval text-orange-400 tracking-wider">
            Potential Hunts
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-medieval text-orange-300">
              {(filteredRecentCollections?.length || 0) +
                (filteredOldCollections?.length || 0)}
            </span>
            <span className="text-lg font-medieval text-purple-300/90">
              Trails to Follow
            </span>
          </div>
        </div>

        <details className="group" open>
          <summary className="cursor-pointer text-xl font-medieval mb-4 text-purple-300/90 hover:text-orange-300 transition-colors duration-200 flex items-center gap-2">
            <span className="text-orange-500/70 group-open:rotate-90 transition-transform duration-200">
              ▶
            </span>
            <span className="tracking-wide">
              View Recent Trails ({filteredRecentCollections?.length})
            </span>
          </summary>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecentCollections?.map(renderCollection)}
          </div>
        </details>

        <details className="mt-8 group">
          <summary className="cursor-pointer text-xl font-medieval mb-4 text-purple-300/90 hover:text-orange-300 transition-colors duration-200 flex items-center gap-2">
            <span className="text-orange-500/70 group-open:rotate-90 transition-transform duration-200">
              ▶
            </span>
            <span className="tracking-wide">
              View Old Trails ({filteredOldCollections?.length})
            </span>
          </summary>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80">
            {filteredOldCollections?.map(renderCollection)}
          </div>
        </details>
      </div>
    </>
  );
}
