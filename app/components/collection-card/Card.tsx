import { useParams } from "react-router";
import type { CollectionAnalysis } from "~/types/magic-eden";
import { getExplorerUrl } from "./helpers";
import { EtherscanIcon } from "~/icons/EtherscanIcon";
import { TwitterIcon } from "~/icons/TwitterIcon";
import { DiscordIcon } from "~/icons/DiscordIcon";

function formatEth(value: number): string {
  return `${value.toFixed(2)} ETH`;
}

function getTimeSinceDeployment(deployedAt: string): string {
  const deploymentDate = new Date(deployedAt);
  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - deploymentDate.getFullYear()) * 12 +
    (now.getMonth() - deploymentDate.getMonth());
  return `${monthsDiff} months ago`;
}

interface CollectionCardProps {
  collection: CollectionAnalysis;
  isSelected?: boolean;
  onSelect?: (contractAddress: string) => void;
}

export function CollectionCard({
  collection,
  isSelected,
  onSelect,
}: CollectionCardProps) {
  const params = useParams();
  const chain = params.chain;

  const explorerUrl = collection.primaryContract
    ? getExplorerUrl(chain || "", collection.primaryContract)
    : "";

  const handleClick = () => {
    if (onSelect && collection.primaryContract) {
      onSelect(collection.primaryContract);
    }
  };

  return (
    <button
      type="button"
      className={`flex flex-col items-start w-full text-left bg-white rounded-lg shadow-lg p-6 
        transition-all duration-200 cursor-pointer
        hover:shadow-xl hover:scale-[1.02] 
        focus:outline-none focus:ring-2 focus:ring-blue-400 
        ${
          isSelected
            ? "ring-2 ring-blue-500 bg-blue-50"
            : "hover:bg-gray-50 active:bg-gray-100"
        }
        relative
      `}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
        <div className="absolute top-3 right-3 z-10">
          <div
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              isSelected
                ? "border-blue-500 bg-blue-500"
                : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && (
              <svg
                className="w-full h-full text-white p-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        {collection.sampleImages?.[0] ? (
          <img
            src={collection.sampleImages[0]}
            alt={`Sample from ${collection.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No preview available</span>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-3 text-black">{collection.name}</h2>
      <div className="space-y-2 text-gray-600">
        <p className="font-semibold text-green-600">
          Total Raised: {formatEth(collection.mintValue)}
        </p>

        <p>Weekly Volume: {formatEth(collection.weeklyVolume)}</p>

        <p>
          Floor Price:{" "}
          {collection.floorPrice
            ? `${collection.floorPrice.amount.native} ${collection.floorPrice.currency.symbol}`
            : "???"}
        </p>

        <p>Launched: {getTimeSinceDeployment(collection.deployedAt)}</p>
      </div>

      {collection.externalUrl && (
        <p className="mt-4">
          <a
            href={collection.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Project Website ↗
          </a>
        </p>
      )}

      {collection.tokenCount && (
        <p className="text-sm text-gray-500 mt-2">
          Token Count: {collection.tokenCount.toLocaleString()}
        </p>
      )}

      <div className="flex gap-4 mt-4">
        {collection.primaryContract && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
            title="View Contract"
          >
            <EtherscanIcon className="w-5 h-5" />
          </a>
        )}

        {collection.twitterUsername && (
          <a
            href={`https://x.com/${collection.twitterUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
            title="Twitter"
          >
            <TwitterIcon className="w-5 h-5" />
          </a>
        )}

        {collection.discordUrl && (
          <a
            href={collection.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
            title="Discord Server"
          >
            <DiscordIcon className="w-5 h-5" />
          </a>
        )}
      </div>
    </button>
  );
}
