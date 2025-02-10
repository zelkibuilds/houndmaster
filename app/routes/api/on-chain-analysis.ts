import type { Route } from "./+types/on-chain-analysis";
import { analyzeMintRevenue } from "~/lib/requests/external/gemini.server";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { isChain } from "~/lib/type-guards/chains";
import { EthereumAddressSchema } from "~/lib/schemas/EthereumAddress";

const ERRORS = {
  METHOD_NOT_ALLOWED: "Only POST requests are allowed for on-chain analysis",
  MISSING_ADDRESS: "Contract address is required",
  MISSING_CHAIN: "Chain parameter is required",
  INVALID_ADDRESS: "Invalid Ethereum address format",
  INVALID_CHAIN: "Invalid chain specified",
} as const;

export async function action({ request }: Route.ActionArgs) {
  invariantResponse(request.method === "POST", {
    status: 405,
    message: ERRORS.METHOD_NOT_ALLOWED,
  });

  const body = await request.json();
  const { address, chain, projectName } = body;

  invariantResponse(address, {
    status: 400,
    message: ERRORS.MISSING_ADDRESS,
  });

  invariantResponse(chain, {
    status: 400,
    message: ERRORS.MISSING_CHAIN,
  });

  const parseAddress = EthereumAddressSchema.safeParse(address);
  invariantResponse(parseAddress.success, {
    status: 400,
    message: ERRORS.INVALID_ADDRESS,
  });

  invariantResponse(isChain(chain), {
    status: 400,
    message: ERRORS.INVALID_CHAIN,
  });

  try {
    const analysis = await analyzeMintRevenue(
      address as `0x${string}`,
      chain,
      projectName
    );
    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to analyze mint revenue:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze mint revenue",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
