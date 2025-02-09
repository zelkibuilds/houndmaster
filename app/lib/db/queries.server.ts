import { eq, and } from "drizzle-orm";
import { db } from "./drizzle.server";
import { contracts, contractSourceCode, contractAbis } from "./schema";
import type { Chain } from "~/config/chains";

export async function getContract(address: string, chain: Chain) {
  return db.query.contracts.findFirst({
    where: and(eq(contracts.address, address), eq(contracts.chain, chain)),
    with: {
      sourceCode: true,
      abi: true,
    },
  });
}

export async function getContractsByChain(chain: Chain) {
  return db.query.contracts.findMany({
    where: eq(contracts.chain, chain),
    orderBy: contracts.verifiedAt,
  });
}

export async function insertContract(
  address: string,
  chain: Chain,
  data: {
    name?: string;
    compilerVersion?: string;
    optimizationUsed?: boolean;
    runs?: number;
    licenseType?: string;
    isProxy?: boolean;
    implementationAddress?: string;
  }
) {
  return db.insert(contracts).values({
    address,
    chain,
    ...data,
  });
}

export async function insertSourceCode(
  contractAddress: string,
  chain: Chain,
  data: {
    sourceCode: string;
    constructorArguments?: string;
    evmVersion?: string;
  }
) {
  return db.insert(contractSourceCode).values({
    contractAddress,
    chain,
    ...data,
  });
}

export async function insertABI(
  contractAddress: string,
  chain: Chain,
  abi: string
) {
  return db.insert(contractAbis).values({
    contractAddress,
    chain,
    abi,
  });
}
