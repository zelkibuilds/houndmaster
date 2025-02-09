import { z } from "zod";

// Base response schema that all Etherscan responses follow
const EtherscanBaseResponseSchema = z.object({
  status: z.union([z.literal("1"), z.literal("0")]),
  message: z.union([z.literal("OK"), z.literal("NOTOK")]),
});

// Contract source code response
export const ContractSourceCodeSchema = z.object({
  SourceCode: z.string(),
  ABI: z.string(),
  ContractName: z.string(),
  CompilerVersion: z.string(),
  OptimizationUsed: z.string(),
  Runs: z.string(),
  ConstructorArguments: z.string(),
  EVMVersion: z.string(),
  Library: z.string(),
  LicenseType: z.string(),
  Proxy: z.string(),
  Implementation: z.string(),
  SwarmSource: z.string(),
});

export const GetSourceCodeResponseSchema = EtherscanBaseResponseSchema.extend({
  result: z.array(ContractSourceCodeSchema),
});

// Contract ABI response
export const GetABIResponseSchema = EtherscanBaseResponseSchema.extend({
  result: z.string(), // Raw ABI string that needs to be parsed
});

// Contract creation info response
export const ContractCreationSchema = z.object({
  contractAddress: z.string(),
  contractCreator: z.string(),
  txHash: z.string(),
});

export const GetContractCreationResponseSchema =
  EtherscanBaseResponseSchema.extend({
    result: z.array(ContractCreationSchema),
  });

// Balance response
export const GetBalanceResponseSchema = EtherscanBaseResponseSchema.extend({
  result: z.string(), // Balance in wei
});

// Error response
export const ErrorResponseSchema = z.object({
  status: z.literal("0"),
  message: z.literal("NOTOK"),
  result: z.string(),
});

// Types
export type ContractSourceCode = z.infer<typeof ContractSourceCodeSchema>;
export type GetSourceCodeResponse = z.infer<typeof GetSourceCodeResponseSchema>;
export type GetABIResponse = z.infer<typeof GetABIResponseSchema>;
export type GetContractCreationResponse = z.infer<
  typeof GetContractCreationResponseSchema
>;
export type GetBalanceResponse = z.infer<typeof GetBalanceResponseSchema>;
export type EtherscanErrorResponse = z.infer<typeof ErrorResponseSchema>;
