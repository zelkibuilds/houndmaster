import type { Chain } from "~/config/chains";

interface OnChainAnalysisRequest {
  address: string;
  chain: Chain;
}

export interface MintAnalysisResult {
  totalRaised: string | null;
  currency: string | null;
  confidence: "high" | "medium" | "low";
  explanation: string;
  missingInfo?: string[];
  mintCount?: number;
  averageMintPrice?: string | null;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

class OnChainAnalysisError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OnChainAnalysisError";
    this.status = status;
  }
}

export async function analyzeMintRevenueForContract(
  request: OnChainAnalysisRequest
): Promise<MintAnalysisResult> {
  try {
    const response = await fetch("/api/on-chain-analysis", {
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
        errorMessage = errorData.error;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch {
        errorMessage = response.statusText || "Unknown error";
      }

      console.error(
        `[On-Chain Analysis] Request failed with status ${response.status}: ${errorMessage}`,
        {
          address: request.address,
          chain: request.chain,
          status: response.status,
        }
      );

      throw new OnChainAnalysisError(errorMessage, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof OnChainAnalysisError) {
      throw error;
    }

    console.error("[On-Chain Analysis] Request failed:", error);
    throw new OnChainAnalysisError(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
