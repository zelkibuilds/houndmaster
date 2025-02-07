import type { CollectionAnalysis } from "~/types/magic-eden";

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
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
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

        <div className="mt-4 pt-4 border-t">
          <p className="font-semibold">Mint Stages:</p>
          {collection.mintStages.map((stage, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <div key={index} className="text-sm mt-1">
              Stage {index + 1}: {formatEth(Number(stage.price))} ×{" "}
              {stage.supply} supply
            </div>
          ))}
        </div>
      </div>
      {collection.externalUrl && (
        <p>
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
        <p>Token Count: {collection.tokenCount.toLocaleString()}</p>
      )}

      {collection.primaryContract && (
        <p>
          <a
            href={`https://etherscan.io/token/${collection.primaryContract}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            View Contract ↗
          </a>
        </p>
      )}

      {collection.twitterUsername && (
        <p>
          <a
            href={`https://x.com/${collection.twitterUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            @{collection.twitterUsername} ↗
          </a>
        </p>
      )}

      {collection.discordUrl && (
        <p>
          <a
            href={collection.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            Discord Server ↗
          </a>
        </p>
      )}
    </div>
  );
}
