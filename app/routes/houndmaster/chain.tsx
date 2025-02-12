import type { Route } from "./+types/chain";
import type { Chain } from "~/config/chains";
import { Suspense, useState, useMemo, useRef, useLayoutEffect } from "react";
import { Await, useNavigation, useParams, useSearchParams } from "react-router";
import { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import { CollectionGallery } from "~/components/collection-gallery/CollectionGallery";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { assertChain, isChain } from "~/lib/type-guards/chains";
import { CHAIN_TO_TOKEN } from "~/config/tokens";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useCollectionSelection } from "~/context/collection-selection";
import { useAnalysisState } from "~/context/analysis-state";

const DEFAULT_MIN_VOLUME = 1;
const DEFAULT_MAX_AGE_MONTHS = 6;
const DEFAULT_MIN_MATCHES = 200;

function AgeInput({ onChange }: { onChange: (value: number) => void }) {
  const [searchParams] = useSearchParams();
  const currentMaxAge =
    Number(searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS;
  const [value, setValue] = useState(currentMaxAge);
  const [unit, setUnit] = useState("months");

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnit(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);

    // Convert to months for the parent
    if (unit === "years") onChange(newValue * 12);
    else if (unit === "days") onChange(newValue / 30);
    else onChange(newValue);
  };

  return (
    <div className="flex gap-3 items-center">
      <input
        type="number"
        value={value}
        onChange={handleValueChange}
        className="w-20 px-3 py-2 bg-[#2D1144] border-2 border-purple-800/50 rounded-lg text-orange-100 font-medieval focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
        id="maxAge"
      />
      <select
        value={unit}
        onChange={handleUnitChange}
        className="px-3 py-2 bg-[#2D1144] border-2 border-purple-800/50 rounded-lg text-orange-100 font-medieval focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCA2TDggMTBMMTIgNiIgc3Ryb2tlPSIjRkY5MDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.5rem] pr-8"
      >
        <option value="days" className="bg-[#1A0B26] text-orange-100">
          Days
        </option>
        <option value="months" className="bg-[#1A0B26] text-orange-100">
          Months
        </option>
        <option value="years" className="bg-[#1A0B26] text-orange-100">
          Years
        </option>
      </select>
    </div>
  );
}

function Filters({ chain }: { chain: Chain }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    clearSelection,
    selectedCollections,
    showOnlyWithWebsites,
    setShowOnlyWithWebsites,
  } = useCollectionSelection();
  const { triggerAnalysis, isAnalyzing } = useAnalysisState();
  const [formValues, setFormValues] = useState({
    minVolume: Number(searchParams.get("minVolume")) || DEFAULT_MIN_VOLUME,
    maxAgeMonths:
      Number(searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS,
    minMatches: Number(searchParams.get("minMatches")) || DEFAULT_MIN_MATCHES,
  });
  const [minVolumeStr, setMinVolumeStr] = useState(
    formValues.minVolume.toString()
  );

  const releaseTheHounds = async () => {
    if (selectedCollections.size === 0) return;
    triggerAnalysis();
  };

  const hasChanges = useMemo(() => {
    // If we have search params, compare against them
    if (
      searchParams.has("minVolume") ||
      searchParams.has("maxAgeMonths") ||
      searchParams.has("minMatches")
    ) {
      const currentMinVolume =
        Number(searchParams.get("minVolume")) || DEFAULT_MIN_VOLUME;
      const currentMaxAge =
        Number(searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS;
      const currentMinMatches =
        Number(searchParams.get("minMatches")) || DEFAULT_MIN_MATCHES;

      return (
        Number(minVolumeStr) !== currentMinVolume ||
        formValues.maxAgeMonths !== currentMaxAge ||
        formValues.minMatches !== currentMinMatches
      );
    }

    // Otherwise compare against initial values
    return (
      Number(minVolumeStr) !== DEFAULT_MIN_VOLUME ||
      formValues.maxAgeMonths !== DEFAULT_MAX_AGE_MONTHS ||
      formValues.minMatches !== DEFAULT_MIN_MATCHES
    );
  }, [searchParams, formValues, minVolumeStr]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col max-[1629px]:flex-col min-[1630px]:flex-row min-[1630px]:items-center gap-4 min-[1630px]:gap-8 min-[1630px]:justify-between">
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-4 shrink-0">
            <span className="text-purple-100 font-medieval min-w-[100px]">
              Min Volume:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minVolumeStr}
                onChange={(e) => {
                  setMinVolumeStr(e.target.value);
                  setFormValues((prev) => ({
                    ...prev,
                    minVolume: Number(e.target.value) || 0,
                  }));
                }}
                step="0.01"
                min="0"
                className="w-24 px-3 py-2 bg-[#2D1144] border-2 border-purple-800/50 rounded-lg text-orange-100 font-medieval focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
              />
              <span className="text-orange-100 font-medieval min-w-[40px]">
                {CHAIN_TO_TOKEN[chain]}
              </span>
            </div>
          </label>

          <label className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 min-w-[100px]">
              <span className="text-purple-100 font-medieval">
                Min Matches:
              </span>
              <Tooltip.Provider>
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger asChild>
                    <svg
                      className="w-4 h-4 text-purple-300/70 hover:text-orange-300/90 transition-colors cursor-help"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-label="Information"
                      role="img"
                    >
                      <title>Information about minimum matches</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      align="start"
                      className="z-50 max-w-xs p-2 bg-[#1A0B26] border-2 border-purple-800/90 rounded-lg text-sm text-purple-100/90 shadow-xl animate-slideDownAndFade"
                      sideOffset={5}
                    >
                      We'll try to fetch at least this many collections (if
                      available) before showing the data
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <input
              type="number"
              value={formValues.minMatches}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  minMatches: Number(e.target.value),
                }))
              }
              min="1"
              step="1"
              className="w-24 px-3 py-2 bg-[#2D1144] border-2 border-purple-800/50 rounded-lg text-orange-100 font-medieval focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
            />
          </label>

          <label htmlFor="maxAge" className="flex items-center gap-4 shrink-0">
            <span className="text-purple-100 font-medieval min-w-[100px]">
              Recent Within:
            </span>
            <AgeInput
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, maxAgeMonths: value }))
              }
            />
          </label>
        </div>

        <div className="flex items-center gap-4 min-[1630px]:pl-8 min-[1630px]:ml-8 min-[1630px]:border-l border-purple-800/30 shrink-0">
          <button
            type="button"
            onClick={clearSelection}
            className={`min-w-[240px] h-[42px] px-6 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                selectedCollections.size === 0
                  ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
              }
            `}
          >
            {selectedCollections.size === 0
              ? "Clear Selection"
              : `Clear Selection (${selectedCollections.size})`}
          </button>
          <button
            type="button"
            onClick={releaseTheHounds}
            disabled={selectedCollections.size === 0 || isAnalyzing}
            className={`min-w-[240px] h-[42px] px-6 rounded-lg transition-all duration-200 font-medieval tracking-wide border-2
              ${
                selectedCollections.size === 0 || isAnalyzing
                  ? "bg-purple-900/30 text-purple-300/70 cursor-not-allowed border-purple-700/50"
                  : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 hover:shadow-lg hover:shadow-orange-500/30 border-orange-500/50 hover:border-orange-400"
              }
            `}
          >
            {isAnalyzing ? "Analyzing..." : "Release the Hounds"}
          </button>
          <label className="flex items-center gap-2 text-purple-100 font-medieval whitespace-nowrap">
            <div className="relative inline-block w-10 h-5">
              <input
                type="checkbox"
                className="peer sr-only"
                id="show-websites"
                checked={showOnlyWithWebsites}
                onChange={(e) => setShowOnlyWithWebsites(e.target.checked)}
              />
              <span className="absolute inset-0 rounded-full bg-purple-900/50 border border-purple-800/50 transition-colors peer-checked:bg-orange-500/50" />
              <span className="absolute inset-0.5 w-4 h-4 rounded-full bg-purple-100 transition-transform peer-checked:translate-x-5" />
            </div>
            With Sites
          </label>
        </div>
      </div>

      {hasChanges && (
        <button
          type="button"
          onClick={() => {
            setSearchParams({
              minVolume: minVolumeStr,
              maxAgeMonths: formValues.maxAgeMonths.toString(),
              minMatches: formValues.minMatches.toString(),
            });
          }}
          className="px-6 py-3 rounded-lg transition-all duration-200 font-medieval text-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  invariantResponse(isChain(params.chain), {
    status: 404,
    message: "Chain not supported",
  });

  const url = new URL(request.url);
  const minVolume =
    Number(url.searchParams.get("minVolume")) || DEFAULT_MIN_VOLUME;
  const maxAgeMonths =
    Number(url.searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS;
  const minMatches =
    Number(url.searchParams.get("minMatches")) || DEFAULT_MIN_MATCHES;

  const fetcher = new MagicEdenAdapter({
    chain: params.chain,
    maxAgeMonths,
    minVolume,
    minTotalCollections: minMatches,
  });

  const collections = fetcher.fetchCollections();

  return {
    collections,
    chain: params.chain,
    currentSettings: {
      minVolume,
      maxAgeMonths,
      minMatches,
    },
  };
};

export default function ChainCollections({ loaderData }: Route.ComponentProps) {
  const { collections, currentSettings } = loaderData;
  const { chain } = useParams();
  const navigation = useNavigation();
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filterHeight, setFilterHeight] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const { isAnalyzing } = useAnalysisState();

  useLayoutEffect(() => {
    const updateFilterHeight = () => {
      if (filtersRef.current) {
        setFilterHeight(filtersRef.current.offsetHeight);
      }
    };

    updateFilterHeight();
    window.addEventListener("resize", updateFilterHeight);
    return () => window.removeEventListener("resize", updateFilterHeight);
  }, []);

  assertChain(chain);

  const magicEdenAdapter = new MagicEdenAdapter({
    chain,
    maxAgeMonths: currentSettings.maxAgeMonths,
    minVolume: currentSettings.minVolume,
  });

  const content =
    navigation.state === "loading" ? (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div>Loading {chain} collections...</div>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        <div
          className="flex-1 overflow-auto"
          style={{ paddingBottom: showFilters ? `${filterHeight}px` : "0" }}
        >
          <div className="container mx-auto p-6">
            <Suspense
              key={chain}
              fallback={<div>Loading {chain} collections...</div>}
            >
              <Await
                resolve={collections}
                errorElement={<div>Error loading collections</div>}
              >
                {(resolvedCollections) => (
                  <CollectionGallery
                    recentCollections={resolvedCollections.recent}
                    oldCollections={resolvedCollections.old}
                    magicEdenAdapter={magicEdenAdapter}
                    onShowingBalancesChange={(showing) =>
                      setShowFilters(!showing)
                    }
                  />
                )}
              </Await>
            </Suspense>
          </div>
        </div>

        {showFilters && !isAnalyzing && (
          <div className="fixed bottom-0 left-0 right-0 z-50" ref={filtersRef}>
            <div className="flex-none px-6 py-4 bg-[#1A0B26]/80 border-t border-purple-800/30 backdrop-blur-sm">
              <div className="container mx-auto">
                <Filters key={chain} chain={chain} />
              </div>
            </div>
          </div>
        )}
      </div>
    );

  return content;
}
