import type { Route } from "./+types/contract-data";

import type {
  BlockExplorerResponse,
  ContractStatus,
} from "~/types/block-explorer";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { ERRORS } from "~/lib/errors";
import { EthereumAddressArraySchema } from "~/lib/schemas/EthereumAddress";
import { isChain } from "~/lib/type-guards/chains";
import * as db from "~/lib/db/queries.server";
import { BlockExplorerAPI } from "~/lib/requests/external/block-explorer.server";

export async function action({ request }: Route.ActionArgs) {
  invariantResponse(request.method === "POST", {
    status: 405,
    message: ERRORS.ETHERSCAN.METHOD_NOT_ALLOWED,
  });

  const { contractAddresses, chain } = await request.json();

  invariantResponse(Array.isArray(contractAddresses), {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CONTRACTS,
  });

  invariantResponse(contractAddresses.length > 0, {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CONTRACTS,
  });

  invariantResponse(chain, {
    status: 400,
    message: ERRORS.ETHERSCAN.MISSING_CHAIN,
  });

  const parseAddresses =
    EthereumAddressArraySchema.safeParse(contractAddresses);
  invariantResponse(parseAddresses.success, {
    status: 400,
    message: ERRORS.ETHERSCAN.INVALID_CONTRACTS_FORMAT,
  });

  invariantResponse(isChain(chain), {
    status: 400,
    message: ERRORS.ETHERSCAN.INVALID_CHAIN,
  });

  const blockExplorer = new BlockExplorerAPI(chain);

  // Check database for each contract
  const results: ContractStatus[] = await Promise.all(
    contractAddresses.map(async (address) => {
      const contract = await db.getContract(address, chain);
      let sourceCode = contract?.sourceCode?.source_code;
      let abi = contract?.abi?.abi;
      let balance: string | undefined;

      // Fetch source code if missing
      if (!sourceCode) {
        try {
          const sourceCodeResponse = await blockExplorer.getSourceCode(address);
          if (sourceCodeResponse.status === "1") {
            const sourceCodeData = sourceCodeResponse.result[0];
            await db.insertContract(address, chain, {
              name: sourceCodeData.ContractName,
              compiler_version: sourceCodeData.CompilerVersion,
              optimization_used: sourceCodeData.OptimizationUsed === "1",
              runs: sourceCodeData.Runs,
              license_type: sourceCodeData.LicenseType,
              is_proxy: sourceCodeData.Proxy === "1",
              implementation_address: sourceCodeData.Implementation,
            });
            await db.insertSourceCode(address, chain, {
              source_code: sourceCodeData.SourceCode,
              constructor_arguments: sourceCodeData.ConstructorArguments,
              evm_version: sourceCodeData.EVMVersion,
            });
            sourceCode = sourceCodeData.SourceCode;
          }
        } catch (error) {
          console.error(`Failed to fetch source code for ${address}:`, error);
        }
      }

      // Fetch ABI if missing
      if (!abi) {
        try {
          const abiResponse = await blockExplorer.getABI(address);
          if (abiResponse.status === "1") {
            await db.insertABI(address, chain, abiResponse.result);
            abi = abiResponse.result;
          }
        } catch (error) {
          console.error(`Failed to fetch ABI for ${address}:`, error);
        }
      }

      // Fetch current balance
      try {
        const balanceResponse = await blockExplorer.getBalance(address);
        if (balanceResponse.status === "1") {
          balance = balanceResponse.result;
        }
      } catch (error) {
        console.error(`Failed to fetch balance for ${address}:`, error);
      }

      return {
        address,
        sourceCode,
        abi,
        lastVerified: contract?.verified_at?.toString(),
        balance,
      };
    })
  );

  const response: BlockExplorerResponse = { results };
  return Response.json(response);
}
