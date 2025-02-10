import { and, eq } from "drizzle-orm";
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
    orderBy: contracts.verified_at,
  });
}

export async function insertContract(
  address: string,
  chain: Chain,
  data: {
    name?: string;
    compiler_version?: string;
    optimization_used?: boolean;
    runs?: string;
    license_type?: string;
    is_proxy?: boolean;
    implementation_address?: string;
  }
) {
  return db
    .insert(contracts)
    .values({
      id: `${address}_${chain}`,
      address,
      chain,
      ...data,
    })
    .onConflictDoUpdate({
      target: [contracts.address, contracts.chain],
      set: data,
    });
}

export async function insertSourceCode(
  address: string,
  chain: Chain,
  data: {
    source_code: string;
    constructor_arguments?: string;
    evm_version?: string;
  }
) {
  return db.insert(contractSourceCode).values({
    contract_address: address,
    contract_chain: chain,
    ...data,
  });
}

export async function insertABI(address: string, chain: Chain, abi: string) {
  return db.insert(contractAbis).values({
    contract_address: address,
    contract_chain: chain,
    abi,
  });
}
