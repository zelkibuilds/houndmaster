import type { Chain } from "~/config/chains";
import {
  GetSourceCodeResponseSchema,
  GetABIResponseSchema,
  GetContractCreationResponseSchema,
  ErrorResponseSchema,
  type GetSourceCodeResponse,
  type GetABIResponse,
  type GetContractCreationResponse,
} from "~/lib/schemas/EtherscanResponse";

if (!process.env.ETHERSCAN_API_KEY) {
  throw new Error("ETHERSCAN_API_KEY is required");
}

const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY;

const BLOCK_EXPLORER_URLS = {
  ethereum: "https://api.etherscan.io",
  base: "https://api.basescan.org",
  arbitrum: "https://api.arbiscan.io",
  polygon: "https://api.polygonscan.com",
  apechain: "https://api.apescan.io",
  abstract: "https://api.abscan.org",
} as const;

export class BlockExplorerAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(chain: Chain) {
    this.apiKey = ETHERSCAN_API_KEY;
    this.baseUrl = BLOCK_EXPLORER_URLS[chain];
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string>
  ) {
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.append("apikey", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url);
    const data = await response.json();

    // Check for error response first
    const errorResult = ErrorResponseSchema.safeParse(data);
    if (errorResult.success) {
      throw new Error(`Block Explorer API Error: ${errorResult.data.result}`);
    }

    return data as T;
  }

  async getSourceCode(address: string): Promise<GetSourceCodeResponse> {
    const data = await this.makeRequest<GetSourceCodeResponse>("/api", {
      module: "contract",
      action: "getsourcecode",
      address,
    });

    const parseResult = GetSourceCodeResponseSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error("Invalid response format from getSourceCode");
    }

    return parseResult.data;
  }

  async getABI(address: string): Promise<GetABIResponse> {
    const data = await this.makeRequest<GetABIResponse>("/api", {
      module: "contract",
      action: "getabi",
      address,
    });

    const parseResult = GetABIResponseSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error("Invalid response format from getABI");
    }

    return parseResult.data;
  }

  async getContractCreation(
    address: string
  ): Promise<GetContractCreationResponse> {
    const data = await this.makeRequest<GetContractCreationResponse>("/api", {
      module: "contract",
      action: "getcontractcreation",
      contractaddresses: address,
    });

    const parseResult = GetContractCreationResponseSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error("Invalid response format from getContractCreation");
    }

    return parseResult.data;
  }
}
