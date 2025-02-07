import type { Route } from "./+types/chain";
import type { Collection } from "~/types/magic-eden";

import { Suspense } from "react";
import { Await, useNavigation, useParams } from "react-router";
import { MagicEdenAdapter } from "~/adapters/marketplaces/magic-eden";
import { CollectionCard } from "~/components/collection-card/Card";

export const loader = async ({ params }: Route.LoaderArgs) => {
  const fetcher = new MagicEdenAdapter({
    chain: params.chain,
  });

  return {
    collections: fetcher.fetchCollections(),
  };
};

export default function MagicEdenPage({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData;
  const { chain } = useParams();
  const navigation = useNavigation();
  const magicEdenAdapter = new MagicEdenAdapter({
    chain,
  });

  if (navigation.state === "loading") {
    return <div>Loading {chain} collections...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Recently Launched NFT Collections
      </h1>

      <Suspense
        key={chain}
        fallback={<div>Loading {chain} collections...</div>}
      >
        <Await
          resolve={collections}
          errorElement={<div>Error loading collections</div>}
        >
          {(resolvedCollections) => {
            const recentCollections = resolvedCollections?.recent;
            const oldCollections = resolvedCollections?.old;

            return (
              <>
                <details className="mt-8" open>
                  <summary className="cursor-pointer text-xl font-semibold mb-4 text-gray-400 hover:text-gray-600">
                    View Recent Collections ({recentCollections?.length})
                  </summary>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recentCollections?.map((collection) => (
                      <CollectionCard
                        key={collection.name}
                        collection={magicEdenAdapter.formatCollectionData(
                          collection
                        )}
                      />
                    ))}
                  </div>
                </details>

                <details className="mt-8">
                  <summary className="cursor-pointer text-xl font-semibold mb-4 text-gray-400 hover:text-gray-600">
                    View Older Collections ({oldCollections?.length})
                  </summary>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                    {oldCollections?.map((collection) => (
                      <CollectionCard
                        key={collection.name}
                        collection={magicEdenAdapter.formatCollectionData(
                          collection
                        )}
                      />
                    ))}
                  </div>
                </details>
              </>
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}
