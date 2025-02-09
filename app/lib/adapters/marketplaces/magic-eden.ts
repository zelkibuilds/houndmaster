import type {
  AdapterConfig,
  Collection,
  ApiResponse,
  CollectionAnalysis,
  TokenSample,
} from "~/types/magic-eden";

export class MagicEdenAdapter {
  private baseUrl: string;
  private config: Required<AdapterConfig>;
  private lastRequestTime: number;
  private count: number;

  constructor(config: AdapterConfig = {}) {
    // Set default configuration with required properties
    this.config = {
      maxAgeMonths: config.maxAgeMonths ?? 6,
      minFloorPrice: config.minFloorPrice ?? 0.1,
      minTotalCollections: config.minTotalCollections ?? 200,
      requestsPerSecond: config.requestsPerSecond ?? 2,
      // Magic Eden sometimes times us out if we set minRequestInterval to 500ms
      minRequestInterval: config.minRequestInterval ?? 600,
      chain: config.chain ?? "ethereum",
      limit: config.limit ?? 1000,
    };

    this.lastRequestTime = 0;
    this.count = 0;

    this.baseUrl = `https://api-mainnet.magiceden.dev/v3/rtp/${this.config.chain}/collections/v7`;
  }

  // Public Methods
  public async fetchCollections(): Promise<{
    recent: Collection[];
    old: Collection[];
  }> {
    const collections: Collection[] = [];
    let continuation: string | null = null;

    try {
      do {
        const params = {
          sortBy: "updatedAt",
          sortDirection: "desc",
          limit: this.config.limit,
          minFloorAskPrice: this.config.minFloorPrice,
          includeMintStages: "true",
          ...(continuation ? { continuation } : {}),
        };

        const response = await this.makeRequest(params);

        const validCollections = this.processCollections(response.collections);
        collections.push(...validCollections);

        continuation = response.continuation ?? null;

        if (this.shouldStopFetching(collections, response)) {
          break;
        }
      } while (continuation);
    } catch (error) {
      console.error("Error during collection fetching:", error);
      return this.separateCollectionsByAge(collections);
    }

    return this.separateCollectionsByAge(collections);
  }

  public formatCollectionData(collection: Collection): CollectionAnalysis {
    return {
      name: collection.name,
      mintValue: this.calculateTotalMintValue(collection),
      weeklyVolume: collection.volume?.["7day"] ?? 0,
      floorPrice: collection.floorAsk?.price,
      deployedAt: collection.contractDeployedAt,
      totalSupply: collection.supply,
      remainingSupply: collection.remainingSupply,
      mintStages: collection.mintStages ?? [],
      externalUrl: collection.externalUrl,
      tokenCount: collection.tokenCount,
      primaryContract: collection.primaryContract,
      twitterUsername: collection.twitterUsername,
      discordUrl: collection.discordUrl,
      sampleImages: collection.sampleImages,
    };
  }

  // Private Methods
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.config.minRequestInterval) {
      const waitTime = this.config.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest(
    params: Record<string, string | number>
  ): Promise<ApiResponse> {
    try {
      await this.enforceRateLimit();

      const url = new URL(this.baseUrl);
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      }

      // Add headers required by Magic Eden API
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
        },
      });
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse;

      if (response.status === 429) {
        console.log("Rate limit reached, implementing longer delay...");
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.minRequestInterval * 4)
        );
        return this.makeRequest(params);
      }

      this.count += this.config.limit;

      return data;
    } catch (error) {
      throw new Error(
        `Failed to fetch collections: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private filterCollectionsByAge(collections: Collection[]): Collection[] {
    const maxAgeDate = new Date();
    maxAgeDate.setMonth(maxAgeDate.getMonth() - this.config.maxAgeMonths);
    const cutoffTimestamp = maxAgeDate.getTime() / 1000;

    return collections.filter((collection) => {
      const deployedAt = collection.contractDeployedAt;
      const result =
        deployedAt && new Date(deployedAt).getTime() >= cutoffTimestamp * 1000;
      return result;
    });
  }

  private separateCollectionsByAge(collections: Collection[]): {
    recent: Collection[];
    old: Collection[];
  } {
    const maxAgeDate = new Date();
    maxAgeDate.setMonth(maxAgeDate.getMonth() - this.config.maxAgeMonths);
    const cutoffTimestamp = maxAgeDate.getTime() / 1000;

    const result = collections.reduce(
      (acc, collection) => {
        const deployedAt = collection.contractDeployedAt;
        const isRecent =
          deployedAt &&
          new Date(deployedAt).getTime() >= cutoffTimestamp * 1000;

        if (isRecent) {
          acc.recent.push(collection);
        } else {
          acc.old.push(collection);
        }
        return acc;
      },
      { recent: [] as Collection[], old: [] as Collection[] }
    );

    result.recent.sort(
      (a, b) =>
        new Date(b.contractDeployedAt).getTime() -
        new Date(a.contractDeployedAt).getTime()
    );

    result.old.sort(
      (a, b) =>
        new Date(b.contractDeployedAt).getTime() -
        new Date(a.contractDeployedAt).getTime()
    );

    return result;
  }

  private shouldStopFetching(
    collections: Collection[],
    response: ApiResponse
  ): boolean {
    if (collections.length >= this.config.minTotalCollections) {
      return true;
    }

    return !response.collections.length || !response.continuation;
  }

  private processCollections(collections: Collection[]): Collection[] {
    if (!Array.isArray(collections)) {
      console.warn("Received invalid collections data:", collections);
      return [];
    }

    return collections.filter((collection) => {
      try {
        return (
          //   this.hasSignificantMinting(collection) &&
          this.hasActiveTrading(collection) &&
          this.hasSignificantVolume(collection)
        );
      } catch (error) {
        console.error(`Error processing collection ${collection.name}:`, error);
        return false;
      }
    });
  }

  private hasSignificantVolume(collection: Collection): boolean {
    return (collection.volume?.allTime ?? 0) >= 1;
  }

  private hasSignificantMinting(collection: Collection): boolean {
    if (!collection.mintStages?.length) {
      return false;
    }

    const totalMintValue = collection.mintStages.reduce((sum, stage) => {
      const price = Number.parseFloat(stage.price || "0");
      const supply = Number.parseInt(stage.supply || "0");
      return sum + price * supply;
    }, 0);

    return totalMintValue >= 10;
  }

  private hasActiveTrading(collection: Collection): boolean {
    return (collection.volume?.["7day"] ?? 0) > 0;
  }

  private calculateTotalMintValue(collection: Collection): number {
    if (!collection.mintStages) return 0;

    return collection.mintStages.reduce((sum, stage) => {
      const price = Number.parseFloat(stage.price || "0");
      const supply = Number.parseInt(stage.supply || "0");
      return sum + price * supply;
    }, 0);
  }
}
