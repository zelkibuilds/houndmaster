import { useParams } from "react-router";
import type { CollectionAnalysis } from "~/types/magic-eden";
import { getExplorerUrl } from "./helpers";
import { EtherscanIcon } from "~/components/icons/EtherscanIcon";
import { TwitterIcon } from "~/components/icons/TwitterIcon";
import { DiscordIcon } from "~/components/icons/DiscordIcon";
import type { Chain } from "~/config/chains";
import { useState } from "react";
import { CHAIN_TO_TOKEN } from "~/config/tokens";

function formatToken(value: number, chain: Chain): string {
  return `${value.toFixed(2)} ${CHAIN_TO_TOKEN[chain]}`;
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
  const [isHovered, setIsHovered] = useState(false);
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
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
      className={`w-full text-left relative bg-[#1A0B26] rounded-xl shadow-lg border-2 cursor-pointer outline-none
        ${
          isSelected
            ? "border-orange-400/80 ring-2 ring-orange-500/50 bg-[#2D1144] shadow-orange-500/20"
            : "border-purple-800/90 hover:border-orange-500/50 hover:bg-[#2D1144] hover:shadow-orange-500/10"
        }
        before:absolute before:inset-px before:rounded-[10px] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none
        after:absolute after:-inset-0.5 after:rounded-xl after:bg-gradient-to-b after:from-purple-500/5 after:via-purple-500/5 after:to-orange-500/10 after:-z-10
        hover:shadow-2xl hover:after:to-orange-500/20
        focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-opacity-50
        focus-visible:hover:border-orange-400 focus-visible:hover:ring-2 focus-visible:hover:ring-orange-400 focus-visible:hover:ring-opacity-50
      `}
    >
      <div className="p-6">
        <div className="flex flex-col items-start">
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
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
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
            <p className="font-medium flex items-center gap-2">
              <span className="text-xs">📈</span>
              <span className="font-medieval">Weekly Volume:</span>{" "}
              {formatToken(collection.weeklyVolume, chain)}
            </p>

            <p className="font-medium flex items-center gap-2">
              <span className="text-xs">💎</span>
              <span className="font-medieval">Floor Price:</span>{" "}
              {collection.floorPrice
                ? `${collection.floorPrice.amount.native} ${CHAIN_TO_TOKEN[chain]}`
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
                className="text-orange-400 hover:text-orange-300 font-medieval inline-flex items-center gap-1"
              >
                <span className="text-xs">🌐</span>
                Project Website
                <span
                  className="transition-transform duration-200"
                  style={{
                    transform: isHovered
                      ? "translateX(0.125rem)"
                      : "translateX(0)",
                  }}
                >
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
        </div>
      </div>
    </button>
  );
}
