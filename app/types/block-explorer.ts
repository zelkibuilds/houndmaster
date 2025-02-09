import type { ActionFunctionArgs } from "react-router";

export interface ContractStatus {
  address: string;
  hasContract: boolean;
  hasSourceCode: boolean;
  hasAbi: boolean;
  lastVerified?: string;
}

export interface BlockExplorerResponse {
  results: ContractStatus[];
}
