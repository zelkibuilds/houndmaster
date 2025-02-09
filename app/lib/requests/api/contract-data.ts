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
    console.info(
      `[Contract Data] Fetching data for ${request.contractAddresses.length} contracts on ${request.chain}`
    );

    const response = await fetch("/api/contract-data", {
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
    console.info(
      `[Contract Data] Successfully fetched data for ${data.results.length} contracts`,
      {
        contractAddresses: request.contractAddresses,
        chain: request.chain,
        hasSourceCode: data.results.filter((r) => r.sourceCode).length,
        hasAbi: data.results.filter((r) => r.abi).length,
      }
    );

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
