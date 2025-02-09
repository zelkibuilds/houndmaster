import type { Route } from "./+types/etherscan";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { ERRORS } from "~/lib/errors";
import { SUPPORTED_CHAINS, type Chain } from "~/config/chains";
import { EthereumAddressArraySchema } from "~/lib/schemas/EthereumAddress";

export async function action({ request }: Route.ActionArgs) {
  invariantResponse(request.method === "POST", {
    status: 405,
    message: ERRORS.ETHERSCAN.METHOD_NOT_ALLOWED,
  });

  const { contractAddresses, chain } = await request.json();

  invariantResponse(Array.isArray(contractAddresses), {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CONTRACTS,
  });

  invariantResponse(contractAddresses.length > 0, {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CONTRACTS,
  });

  invariantResponse(chain, {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CHAIN,
  });

  const parseAddresses =
    EthereumAddressArraySchema.safeParse(contractAddresses);
  invariantResponse(parseAddresses.success, {
    status: 400,
    message: ERRORS.ETHERSCAN.INVALID_CONTRACTS_FORMAT,
  });

  invariantResponse(SUPPORTED_CHAINS.includes(chain as Chain), {
    status: 400,
    message: ERRORS.ETHERSCAN.INVALID_CHAIN,
  });

  return Response.json(
    {
      data: 1,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
