import type { Chain } from "~/config/chains";
import type { BlockExplorerResponse } from "~/types/block-explorer";

interface ContractDataRequest {
  contractAddresses: string[];
  chain: Chain;
}

interface ErrorResponse {
  message: string;
  status: number;
}

class ContractDataError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ContractDataError";
    this.status = status;
  }
}

export async function getContractData(
  request: ContractDataRequest
): Promise<BlockExplorerResponse> {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api`
        : process.env.API_URL;

    if (!baseUrl) {
      throw new Error("API_URL environment variable is not set");
    }

    const response = await fetch(`${baseUrl}/contract-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = (await response.json()) as ErrorResponse;
        errorMessage = errorData.message;
      } catch {
        errorMessage = response.statusText || "Unknown error";
      }

      console.error(
        `[Contract Data] Request failed with status ${response.status}: ${errorMessage}`,
        {
          contractAddresses: request.contractAddresses,
          chain: request.chain,
          status: response.status,
        }
      );

      throw new ContractDataError(errorMessage, response.status);
    }

    const data = (await response.json()) as BlockExplorerResponse;

    return data;
  } catch (error) {
    if (error instanceof ContractDataError) {
      throw error;
    }

    console.error("[Contract Data] Unexpected error during request", {
      error,
      contractAddresses: request.contractAddresses,
      chain: request.chain,
    });

    throw new ContractDataError(
      "An unexpected error occurred while fetching contract data",
      500
    );
  }
}
