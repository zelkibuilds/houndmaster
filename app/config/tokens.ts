import type { Chain } from "./chains";

export const CHAIN_TO_TOKEN: Record<Chain, string> = {
  ethereum: "ETH",
  base: "ETH",
  apechain: "APE",
  abstract: "ETH",
  polygon: "MATIC",
} as const;
