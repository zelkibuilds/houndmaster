export const SUPPORTED_CHAINS = [
  "ethereum",
  "base",
  "arbitrum",
  "apechain",
  "abstract",
  "polygon",
] as const;

export type Chain = (typeof SUPPORTED_CHAINS)[number];
