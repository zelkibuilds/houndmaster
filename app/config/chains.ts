export const SUPPORTED_CHAINS = [
  "ethereum",
  "base",
  "apechain",
  "abstract",
  "polygon",
  "arbitrum",
] as const;

export type Chain = (typeof SUPPORTED_CHAINS)[number];
