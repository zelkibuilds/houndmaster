import { useParams } from "react-router";
import type { CollectionAnalysis } from "~/types/magic-eden";
import { getExplorerUrl } from "./helpers";
import { EtherscanIcon } from "~/components/icons/EtherscanIcon";
import { TwitterIcon } from "~/components/icons/TwitterIcon";
import { DiscordIcon } from "~/components/icons/DiscordIcon";
import type { Chain } from "~/config/chains";

function formatToken(value: number, chain?: string): string {
  const symbol = chain === "apechain" ? "APE" : "ETH";
  return `${value.toFixed(2)} ${symbol}`;
}

function getTimeSinceDeployment(deployedAt: string): string {
  const deploymentDate = new Date(deployedAt);
  const now = new Date();
  const diffMs = now.getTime() - deploymentDate.getTime();

  // Convert to various units
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  // Less than a day: show hours, minutes, seconds
  if (days < 1) {
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s ago`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s ago`;
    }
    return `${seconds}s ago`;
  }

  // Less than a month: show days
  if (months < 1) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  // Show months
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

interface CollectionCardProps {
  collection: CollectionAnalysis;
  isSelected: boolean;
  onSelect: (contractAddress: string) => void;
  chain: Chain;
}

export function CollectionCard({
  collection,
  isSelected,
  onSelect,
  chain,
}: CollectionCardProps) {
  const params = useParams();
  const symbol = chain === "apechain" ? "APE" : "ETH";

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
      className={`flex flex-col items-start w-full text-left bg-[#1A0B26] rounded-xl shadow-lg p-6 
        transition-all duration-200 cursor-pointer border-2 
        ${
          isSelected
            ? "border-orange-400/80 ring-2 ring-orange-500/50 bg-[#2D1144] shadow-orange-500/20"
            : "border-purple-800/90 hover:border-orange-500/50 hover:bg-[#2D1144] hover:shadow-orange-500/10"
        }
        relative before:absolute before:inset-px before:rounded-[10px] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none
        after:absolute after:-inset-0.5 after:rounded-xl after:bg-gradient-to-b after:from-purple-500/5 after:via-purple-500/5 after:to-orange-500/10 after:-z-10
        hover:shadow-2xl hover:scale-[1.02] hover:after:to-orange-500/20
        focus:outline-none focus:ring-2 focus:ring-orange-500/50
      `}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-[#2D1144] border border-purple-700/30">
        <div className="absolute top-3 right-3 z-10">
          <div
            className={`w-5 h-5 rounded-full transition-all duration-300 ${
              isSelected
                ? "bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-orange-300 shadow-lg shadow-orange-500/30"
                : "border-2 border-purple-400/30 bg-[#1A0B26]"
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
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#1A0B26] flex items-center justify-center">
            <span className="text-purple-200/50 text-sm font-medieval">
              No preview available
            </span>
          </div>
        )}
      </div>

      <h2
        className="text-xl font-bold mb-3 text-orange-100 font-medieval tracking-wider w-full"
        title={collection.name}
      >
        <div className="line-clamp-2 break-words overflow-hidden text-ellipsis max-w-[calc(100%-1rem)]">
          {collection.name}
        </div>
      </h2>
      <div className="space-y-2.5 text-purple-100">
        <p className="font-semibold text-orange-400 flex items-center gap-2 font-medieval">
          <span className="text-xs">⚔️</span>
          Total Raised: {formatToken(collection.mintValue, chain)}
        </p>

        <p className="font-medium flex items-center gap-2">
          <span className="text-xs">📈</span>
          <span className="font-medieval">Weekly Volume:</span>{" "}
          {formatToken(collection.weeklyVolume, chain)}
        </p>

        <p className="font-medium flex items-center gap-2">
          <span className="text-xs">💎</span>
          <span className="font-medieval">Floor Price:</span>{" "}
          {collection.floorPrice
            ? `${collection.floorPrice.amount.native} ${
                chain === "apechain"
                  ? "APE"
                  : collection.floorPrice.currency.symbol
              }`
            : "???"}
        </p>

        <p className="font-medium flex items-center gap-2">
          <span className="text-xs">🗓</span>
          <span className="font-medieval">Launched:</span>{" "}
          {getTimeSinceDeployment(collection.deployedAt)}
        </p>
      </div>

      {collection.externalUrl && (
        <p className="mt-4">
          <a
            href={collection.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 font-medieval inline-flex items-center gap-1 group"
          >
            Project Website
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        </p>
      )}

      {collection.tokenCount && (
        <p className="text-sm text-purple-300/90 mt-2 font-medium flex items-center gap-2">
          <span className="text-xs">👥</span>
          <span className="font-medieval">Token Count:</span>{" "}
          {collection.tokenCount.toLocaleString()}
        </p>
      )}

      <div className="flex gap-4 mt-4 border-t border-purple-800/30 pt-4">
        {collection.primaryContract && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-200 hover:text-orange-300 transition-colors"
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
            className="text-purple-200 hover:text-orange-300 transition-colors"
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
            className="text-purple-200 hover:text-orange-300 transition-colors"
            title="Discord Server"
          >
            <DiscordIcon className="w-5 h-5" />
          </a>
        )}
      </div>
    </button>
  );
}
