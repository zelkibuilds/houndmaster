import type { Chain } from "~/config/chains";
import {
  GetSourceCodeResponseSchema,
  GetABIResponseSchema,
  GetContractCreationResponseSchema,
  GetBalanceResponseSchema,
  ErrorResponseSchema,
  type GetSourceCodeResponse,
  type GetABIResponse,
  type GetContractCreationResponse,
  type GetBalanceResponse,
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

// Singleton rate limiter to handle all requests across instances
const globalRateLimiter = new (class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private readonly maxRequestsPerSecond = 4;
  private readonly minInterval = 250; // 1000ms / 4 requests
  private currentSecondStart = Date.now();

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

      void this.processQueue();
    });
  }

  private async executeWithThrottle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if we're in a new second
    if (now - this.currentSecondStart >= 1000) {
      this.currentSecondStart = now;
      this.requestCount = 0;
    }

    // If we've hit the limit, wait for next second
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.currentSecondStart);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.currentSecondStart = Date.now();
      this.requestCount = 0;
    }

    // Ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    return fn();
  }

  private async processQueue() {
    if (this.processing) return;

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        if (request) {
          await request();
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        void this.processQueue();
      }
    }
  }
})();

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
  ): Promise<T> {
    return globalRateLimiter.schedule(async () => {
      const url = new URL(endpoint, this.baseUrl);
      url.searchParams.set("apikey", this.apiKey);
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

  async getBalance(address: string): Promise<GetBalanceResponse> {
    const data = await this.makeRequest<GetBalanceResponse>("/api", {
      module: "account",
      action: "balance",
      address,
      tag: "latest",
    });

    const parseResult = GetBalanceResponseSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error("Invalid response format from getBalance");
    }

    return parseResult.data;
  }
}
