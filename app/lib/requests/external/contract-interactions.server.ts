import {
  createPublicClient,
  http,
  type Address,
  type PublicClient,
  parseAbiItem,
  type AbiEvent,
} from "viem";
import { mainnet, base, arbitrum, polygon } from "viem/chains";
import type { Chain } from "~/config/chains";

const CHAIN_TO_VIEM_CHAIN = {
  ethereum: mainnet,
  base,
  arbitrum,
  polygon,
  apechain: mainnet, // TODO: Add correct chain config
  abstract: mainnet, // TODO: Add correct chain config
} as const;

interface ContractFunction {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
}

function findSupplyFunction(abi: ContractFunction[]): ContractFunction | null {
  const supplyFunctions = abi.filter(
    (fn) =>
      fn.type === "function" &&
      fn.stateMutability === "view" &&
      fn.outputs.length === 1 &&
      fn.outputs[0].type === "uint256" &&
      fn.inputs.length === 0 &&
      /^(?:total|max|_max|_total)?supply$/i.test(fn.name)
  );

  // Sort by priority: totalSupply, maxSupply, _maxSupply, supply
  const priorityOrder = ["totalSupply", "maxSupply", "_maxSupply", "supply"];
  return (
    supplyFunctions.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })[0] || null
  );
}

export async function getContractSupply(
  address: Address,
  chain: Chain,
  abi: ContractFunction[]
): Promise<bigint | null> {
  const supplyFunction = findSupplyFunction(abi);
  if (!supplyFunction) {
    return null;
  }

  const client = createPublicClient({
    chain: CHAIN_TO_VIEM_CHAIN[chain],
    transport: http(),
  });

  try {
    const supply = await client.readContract({
      address,
      abi: [supplyFunction],
      functionName: supplyFunction.name,
    });

    return supply as bigint;
  } catch (error) {
    console.error(`Failed to read ${supplyFunction.name}:`, error);
    return null;
  }
}

export async function getContractEvents(
  address: Address,
  chain: Chain,
  events: AbiEvent[]
) {
  const client = createPublicClient({
    chain: CHAIN_TO_VIEM_CHAIN[chain],
    transport: http(),
  });

  const logs = await Promise.all(
    events.map((event) =>
      client
        .getLogs({
          address,
          event,
          fromBlock: 0n,
          toBlock: "latest",
        })
        .catch(() => [])
    )
  );

  return logs.flat();
}
