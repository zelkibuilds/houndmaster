import type { Route } from "./+types/houndmaster";

import { Suspense } from "react";
import { Await } from "react-router";
import { NFTCollectionFetcher } from "~/services/NFTCollectionFetcher";
import { CollectionCard } from "~/components/Card";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const fetcher = new NFTCollectionFetcher();

  return {
    collections: fetcher
      .fetchCollections()
      .then((collections) =>
        collections.map((c) => ({
          mintValue: Number(c.mintStages?.[0]?.price || "0"),
          weeklyVolume: Number(c.volume?.["7day"] || "0"),
          floorPrice: c.floorAsk?.price,
          deployedAt: c.contractDeployedAt,
          totalSupply: c.supply,
          remainingSupply: c.remainingSupply,
          name: c.name,
          description: c.description,
          id: c.id,
          symbol: c.symbol,
          mintStages: c.mintStages || [],
          externalUrl: c.externalUrl,
          tokenCount: c.tokenCount,
          primaryContract: c.primaryContract,
          twitterUsername: c.twitterUsername,
          discordUrl: c.discordUrl,
        }))
      )
      .catch((error) => {
        console.error("Failed to fetch collections:", error);
        return [];
      }),
  };
};

export default function MagicEdenPage({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Recently Launched NFT Collections
      </h1>

      <Suspense fallback={<div>Loading collections...</div>}>
        <Await
          resolve={collections}
          errorElement={<div>Error loading collections</div>}
        >
          {(resolvedCollections) => (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resolvedCollections.map((collection) => (
                <CollectionCard key={collection.name} collection={collection} />
              ))}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
