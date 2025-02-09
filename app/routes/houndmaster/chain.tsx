import type { Route } from "./+types/chain";
import { Suspense } from "react";
import { Await, useNavigation, useParams } from "react-router";
import { MagicEdenAdapter } from "~/lib/adapters/marketplaces/magic-eden";
import { CollectionGallery } from "~/components/collection-gallery/CollectionGallery";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { assertChain, isChain } from "~/lib/type-guards/chains";

export const loader = async ({ params }: Route.LoaderArgs) => {
  invariantResponse(isChain(params.chain), {
    status: 404,
    message: "Chain not supported",
  });

  const fetcher = new MagicEdenAdapter({
    chain: params.chain,
  });

  const collections = fetcher.fetchCollections();

  return {
    collections,
    chain: params.chain,
  };
};

export default function MagicEdenPage({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData;
  const { chain } = useParams();
  const navigation = useNavigation();

  assertChain(chain);

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
