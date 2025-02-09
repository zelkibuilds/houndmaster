export const ERRORS = {
  ETHERSCAN: {
    METHOD_NOT_ALLOWED:
      "Only POST requests are allowed for Etherscan API endpoints",
    MISSING_CONTRACTS: "Contract addresses are required",
    MISSING_CHAIN: "Chain parameter is required",
    INVALID_CONTRACTS_FORMAT:
      "Contract addresses must be an array of valid Ethereum addresses",
    INVALID_CHAIN:
      "Chain must be one of: ethereum, polygon, arbitrum, optimism",
  },
} as const;
