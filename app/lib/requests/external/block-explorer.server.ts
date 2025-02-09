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

class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestsInLastSecond = 0;
  private readonly maxRequestsPerSecond = 5;
  private readonly minRequestInterval = 200; // 1000ms / 5 requests = 200ms minimum interval

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithThrottle(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async executeWithThrottle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset counter if more than 1 second has passed
    if (timeSinceLastRequest > 1000) {
      this.requestsInLastSecond = 0;
    }

    // If we've made too many requests, wait until the next second
    if (this.requestsInLastSecond >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestsInLastSecond = 0;
    }

    // Ensure minimum interval between requests
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestsInLastSecond++;

    return fn();
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
      }
    }

    this.processing = false;
  }
}

export class BlockExplorerAPI {
  private apiKey: string;
  private baseUrl: string;
  private rateLimiter: RateLimiter;

  constructor(chain: Chain) {
    this.apiKey = ETHERSCAN_API_KEY;
    this.baseUrl = BLOCK_EXPLORER_URLS[chain];
    this.rateLimiter = new RateLimiter();
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string>
  ): Promise<T> {
    return this.rateLimiter.schedule(async () => {
      const url = new URL(endpoint, this.baseUrl);
      url.searchParams.append("apikey", this.apiKey);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }

      console.info(`[Block Explorer] Making request to ${url.pathname}`);
      const response = await fetch(url);
      const data = await response.json();

      // Check for error response first
      const errorResult = ErrorResponseSchema.safeParse(data);
      if (errorResult.success) {
        throw new Error(`Block Explorer API Error: ${errorResult.data.result}`);
      }

      return data as T;
    });
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
