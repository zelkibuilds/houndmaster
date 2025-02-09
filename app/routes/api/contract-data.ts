import type { Route } from "./+types/contract-data";

import type {
  BlockExplorerResponse,
  ContractStatus,
} from "~/types/block-explorer";
import { invariantResponse } from "~/lib/invariant-response/invariant-response";
import { ERRORS } from "~/lib/errors";
import { EthereumAddressArraySchema } from "~/lib/schemas/EthereumAddress";
import { isChain } from "~/lib/type-guards/chains";
import {
  getContract,
  insertContract,
  insertSourceCode,
  insertABI,
} from "~/lib/db/queries.server";
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
      const contract = await getContract(address, chain);

      // If we don't have source code or ABI, fetch them
      if (!contract?.sourceCode || !contract?.abi) {
        try {
          // Create contract record if it doesn't exist
          if (!contract) {
            await insertContract(address, chain, {});
          }

          // Fetch source code if missing
          if (!contract?.sourceCode) {
            const sourceCodeResponse = await blockExplorer.getSourceCode(
              address
            );
            if (sourceCodeResponse.status === "1") {
              const sourceCode = sourceCodeResponse.result[0];
              await insertSourceCode(address, chain, {
                source_code: sourceCode.SourceCode,
                constructor_arguments: sourceCode.ConstructorArguments,
                evm_version: sourceCode.EVMVersion,
              });
            }
          }

          // Fetch ABI if missing
          if (!contract?.abi) {
            const abiResponse = await blockExplorer.getABI(address);
            if (abiResponse.status === "1") {
              await insertABI(address, chain, abiResponse.result);
            }
          }

          // Get updated contract data
          const updatedContract = await getContract(address, chain);
          return {
            address,
            hasContract: !!updatedContract,
            hasSourceCode: !!updatedContract?.sourceCode,
            hasAbi: !!updatedContract?.abi,
            lastVerified: updatedContract?.verified_at?.toString(),
          };
        } catch (error) {
          console.error(`Failed to fetch contract data for ${address}:`, error);
        }
      }

      return {
        address,
        hasContract: !!contract,
        hasSourceCode: !!contract?.sourceCode,
        hasAbi: !!contract?.abi,
        lastVerified: contract?.verified_at?.toString(),
      };
    })
  );

  const response: BlockExplorerResponse = { results };
  return Response.json(response);
}
