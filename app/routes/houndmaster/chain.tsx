import type { Route } from "./+types/chain";

import { Suspense } from "react";
import { Await, useNavigation, useParams } from "react-router";
import { MagicEdenAdapter } from "~/adapters/marketplaces/magic-eden";
import { CollectionGallery } from "~/components/collection-gallery/CollectionGallery";

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
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}
