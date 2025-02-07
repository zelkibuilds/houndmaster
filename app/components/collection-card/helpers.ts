export const getExplorerUrl = (chain: string, address: string) => {
  const explorers = {
    ethereum: `https://etherscan.io/address/${address}`,
    base: `https://basescan.org/address/${address}`,
    arbitrum: `https://arbiscan.io/address/${address}`,
    apechain: `https://apechain.explorer.io/address/${address}`,
    abstract: `https://abstract.explorer.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
  };
  return explorers[chain as keyof typeof explorers] || "";
};
