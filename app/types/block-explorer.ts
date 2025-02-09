export interface ContractStatus {
  address: string;
  sourceCode?: string;
  abi?: string;
  lastVerified?: string;
}

export interface BlockExplorerResponse {
  results: ContractStatus[];
}
