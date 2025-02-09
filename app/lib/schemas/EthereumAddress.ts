import { z } from "zod";

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const EthereumAddressSchema = z
  .string()
  .regex(ethereumAddressRegex, "Invalid Ethereum address format");
export const EthereumAddressArraySchema = z.array(EthereumAddressSchema);

export type EthereumAddress = z.infer<typeof EthereumAddressSchema>;
