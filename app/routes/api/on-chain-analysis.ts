import type { Route } from "./+types/on-chain-analysis";

export async function action({ request }: Route.ActionArgs) {
  const { address, chain } = await request.json();
}
