import type { Route } from "./+types/chain";
import type { Chain } from "~/config/chains";
import { Suspense, useState, useMemo } from "react";
import { Await, useNavigation, useParams, useSearchParams } from "react-router";
import { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import { CollectionGallery } from "~/components/collection-gallery/CollectionGallery";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { assertChain, isChain } from "~/lib/type-guards/chains";
import { CHAIN_TO_TOKEN } from "~/config/tokens";

const DEFAULT_MIN_VOLUME = 1;
const DEFAULT_MAX_AGE_MONTHS = 6;

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
  const [formValues, setFormValues] = useState({
    minVolume: Number(searchParams.get("minVolume")) || DEFAULT_MIN_VOLUME,
    maxAgeMonths:
      Number(searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS,
  });

  const hasChanges = useMemo(() => {
    // If we have search params, compare against them
    if (searchParams.has("minVolume") || searchParams.has("maxAgeMonths")) {
      const currentMinVolume =
        Number(searchParams.get("minVolume")) || DEFAULT_MIN_VOLUME;
      const currentMaxAge =
        Number(searchParams.get("maxAgeMonths")) || DEFAULT_MAX_AGE_MONTHS;

      return (
        formValues.minVolume !== currentMinVolume ||
        formValues.maxAgeMonths !== currentMaxAge
      );
    }

    // Otherwise compare against initial values
    return (
      formValues.minVolume !== DEFAULT_MIN_VOLUME ||
      formValues.maxAgeMonths !== DEFAULT_MAX_AGE_MONTHS
    );
  }, [searchParams, formValues]);

  return (
    <div className="mb-6 bg-[#1A0B26] rounded-xl shadow-lg border-2 border-purple-800/90 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3">
            <span className="text-purple-100 font-medieval">Min Volume:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formValues.minVolume}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    minVolume: Number(e.target.value),
                  }))
                }
                step="0.1"
                min="0"
                className="w-24 px-3 py-2 bg-[#2D1144] border-2 border-purple-800/50 rounded-lg text-orange-100 font-medieval focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
              />
              <span className="text-orange-100 font-medieval">
                {CHAIN_TO_TOKEN[chain]}
              </span>
            </div>
          </label>

          <label htmlFor="maxAge" className="flex items-center gap-3">
            <span className="text-purple-100 font-medieval">
              Recent Within:
            </span>
            <AgeInput
              onChange={(value) =>
                setFormValues((prev) => ({ ...prev, maxAgeMonths: value }))
              }
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            if (hasChanges) {
              setSearchParams({
                minVolume: formValues.minVolume.toString(),
                maxAgeMonths: formValues.maxAgeMonths.toString(),
              });
            }
          }}
          disabled={!hasChanges}
          className={`px-6 py-3 rounded-lg transition-all duration-200 font-medieval text-lg ${
            hasChanges
              ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
              : "bg-purple-900/30 text-purple-200/50 cursor-not-allowed border border-purple-800/30"
          }`}
        >
          Apply Filters
        </button>
      </div>
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

  const fetcher = new MagicEdenAdapter({
    chain: params.chain,
    maxAgeMonths,
    minVolume,
  });

  const collections = fetcher.fetchCollections();

  return {
    collections,
    chain: params.chain,
    currentSettings: {
      minVolume,
      maxAgeMonths,
    },
  };
};

export default function MagicEdenPage({ loaderData }: Route.ComponentProps) {
  const { collections, currentSettings } = loaderData;
  const { chain } = useParams();
  const navigation = useNavigation();

  assertChain(chain);

  const magicEdenAdapter = new MagicEdenAdapter({
    chain,
    maxAgeMonths: currentSettings.maxAgeMonths,
    minVolume: currentSettings.minVolume,
  });

  if (navigation.state === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 bg-[#1A0B26] rounded-xl shadow-lg border-2 border-purple-800/90 p-6 animate-pulse">
          <div className="h-24 bg-purple-800/20 rounded-lg" />
        </div>
        <div>Loading {chain} collections...</div>
      </div>
    );
  }

  return (
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
            <>
              <Filters key={chain} chain={chain} />
              <CollectionGallery
                recentCollections={resolvedCollections.recent}
                oldCollections={resolvedCollections.old}
                magicEdenAdapter={magicEdenAdapter}
              />
            </>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
