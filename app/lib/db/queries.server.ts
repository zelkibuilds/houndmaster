import { eq } from "drizzle-orm";
import { db } from "./drizzle.server";
import { contracts, contractSourceCode, contractAbis } from "./schema";
import type { Chain } from "~/config/chains";

function getContractId(address: string, chain: Chain): string {
  return `${address}_${chain}`;
}

export async function getContract(address: string, chain: Chain) {
  return db.query.contracts.findFirst({
    where: eq(contracts.id, getContractId(address, chain)),
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
    runs?: number;
    license_type?: string;
    is_proxy?: boolean;
    implementation_address?: string;
  }
) {
  return db.insert(contracts).values({
    id: getContractId(address, chain),
    address,
    chain,
    ...data,
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
  const contractId = getContractId(address, chain);
  return db.insert(contractSourceCode).values({
    id: contractId,
    contract_id: contractId,
    ...data,
  });
}

export async function insertABI(address: string, chain: Chain, abi: string) {
  const contractId = getContractId(address, chain);
  return db.insert(contractAbis).values({
    id: contractId,
    contract_id: contractId,
    abi,
  });
}
