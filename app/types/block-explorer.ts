export interface ContractStatus {
  address: string;
  sourceCode?: string;
  abi?: string;
  lastVerified?: string;
  balance?: string; // Balance in wei
}

export interface BlockExplorerResponse {
  results: ContractStatus[];
}
