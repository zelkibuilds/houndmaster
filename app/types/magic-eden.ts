import type { Chain } from "~/config/chains";

export interface AdapterConfig {
  chain?: Chain;
  maxAgeMonths?: number;
  minFloorPrice?: number;
  minTotalCollections?: number;
  requestsPerSecond?: number;
  minRequestInterval?: number;
  limit?: number;
  minVolume?: number;
}

export interface PriceAmount {
  raw?: string;
  decimal: number;
  usd: number;
  native: number;
}

export interface Price {
  currency: {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  amount: PriceAmount;
}

export interface MintStage {
  price: string;
  supply: string;
  startTime?: string;
  endTime?: string;
}

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  externalUrl?: string;
  tokenCount?: number;
  primaryContract?: string;
  description?: string;
  contractDeployedAt: string;
  mintStages?: MintStage[];
  supply: string;
  remainingSupply: string;
  sampleImages?: string[];
  volume?: {
    "1day": number;
    "7day": number;
    "30day": number;
    allTime: number;
  };
  floorAsk?: {
    price: Price;
  };
  twitterUsername?: string;
  discordUrl?: string;
}

export interface TokenSample {
  image: string;
}

export interface ApiResponse {
  collections: Collection[];
  continuation?: string;
  tokens?: TokenSample[];
}

export interface CollectionAnalysis {
  name: string;
  mintValue: number;
  weeklyVolume: number;
  floorPrice?: Price;
  deployedAt: string;
  totalSupply?: string;
  remainingSupply?: string;
  mintStages: MintStage[];
  externalUrl?: string;
  tokenCount?: number;
  primaryContract?: string;
  twitterUsername?: string;
  discordUrl?: string;
  sampleImages?: string[];
}
