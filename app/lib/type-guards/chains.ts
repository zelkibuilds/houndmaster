import { SUPPORTED_CHAINS, type Chain } from "~/config/chains";

export function assertChain(value: unknown): asserts value is Chain {
  if (
    !(typeof value === "string" && SUPPORTED_CHAINS.includes(value as Chain))
  ) {
    throw new Error(
      `Invalid chain: ${value}. Must be one of: ${SUPPORTED_CHAINS.join(", ")}`
    );
  }
}

export function isChain(value: unknown): value is Chain {
  return typeof value === "string" && SUPPORTED_CHAINS.includes(value as Chain);
}
