import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getContract } from "~/lib/db/queries.server";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { mainnet, base, arbitrum, polygon } from "viem/chains";
import type { Chain } from "~/config/chains";

const genAI = google("gemini-2.0-flash-001");

const CHAIN_TO_VIEM_CHAIN = {
  ethereum: mainnet,
  base,
  arbitrum,
  polygon,
  apechain: mainnet, // TODO: Add correct chain config
  abstract: mainnet, // TODO: Add correct chain config
} as const;

type MintAnalysisResult = {
  totalRaised: string | null;
  currency: string | null;
  confidence: "high" | "medium" | "low";
  explanation: string;
  missingInfo?: string[];
};

export async function analyzeMintRevenue(
  address: Address,
  chain: Chain
): Promise<MintAnalysisResult> {
  // 1. First try to analyze from contract source code
  const contract = await getContract(address, chain);
  if (!contract?.sourceCode) {
    return {
      totalRaised: null,
      currency: null,
      confidence: "low",
      explanation: "No verified source code found",
      missingInfo: ["verified contract source code"],
    };
  }

  const sourceCodePrompt = `
    Analyze this smart contract source code and tell me:
    1. The mint price per token (if fixed) or the pricing mechanism (if variable)
    2. Any maximum supply limits
    3. The currency used for minting (ETH, specific ERC20, etc.)
    4. Any relevant mint functions and their parameters
    
    Source code:
    ${contract.sourceCode.source_code}
    
    Format your response as JSON with these fields:
    {
      "mintPrice": string | null,
      "isVariablePrice": boolean,
      "maxSupply": number | null,
      "currency": string,
      "mintFunctions": string[],
      "confidence": "high" | "medium" | "low",
      "explanation": string
    }
  `;

  const { text: sourceCodeResponse } = await generateText({
    model: genAI,
    prompt: sourceCodePrompt,
  });
  const sourceCodeAnalysis = JSON.parse(sourceCodeResponse);

  // If we have high confidence in source code analysis and fixed price
  if (
    sourceCodeAnalysis.confidence === "high" &&
    !sourceCodeAnalysis.isVariablePrice &&
    sourceCodeAnalysis.mintPrice &&
    sourceCodeAnalysis.maxSupply
  ) {
    // Get total supply
    const client = createPublicClient({
      chain: CHAIN_TO_VIEM_CHAIN[chain],
      transport: http(),
    });

    try {
      const totalSupply = await client.readContract({
        address,
        abi: [parseAbiItem("function totalSupply() view returns (uint256)")],
        functionName: "totalSupply",
      });

      const totalRaised =
        BigInt(totalSupply) * BigInt(sourceCodeAnalysis.mintPrice);

      return {
        totalRaised: totalRaised.toString(),
        currency: sourceCodeAnalysis.currency,
        confidence: "high",
        explanation: `Calculated from fixed mint price of ${sourceCodeAnalysis.mintPrice} ${sourceCodeAnalysis.currency} * total supply of ${totalSupply}`,
      };
    } catch (e) {
      console.error("Failed to get total supply:", e);
    }
  }

  // If we need more data, look for mint events
  const mintEvents = await getMintEvents(address, chain);
  if (mintEvents && mintEvents.length > 0) {
    // Analyze mint events with Gemini
    const eventsPrompt = `
      Analyze these mint events and tell me the total amount raised.
      Events: ${JSON.stringify(mintEvents)}
      
      Previous source code analysis: ${JSON.stringify(sourceCodeAnalysis)}
      
      Format response as JSON:
      {
        "totalRaised": string,
        "currency": string,
        "confidence": "high" | "medium" | "low",
        "explanation": string
      }
    `;

    const { text: eventsResponse } = await generateText({
      model: genAI,
      prompt: eventsPrompt,
    });
    return JSON.parse(eventsResponse);
  }

  // If we still can't determine
  return {
    totalRaised: null,
    currency: null,
    confidence: "low",
    explanation: "Could not determine total raised from available data",
    missingInfo: [
      "mint event logs",
      "accurate price information",
      "total supply data",
    ],
  };
}

async function getMintEvents(address: Address, chain: Chain) {
  const client = createPublicClient({
    chain: CHAIN_TO_VIEM_CHAIN[chain],
    transport: http(),
  });

  // Common mint event signatures
  const eventSignatures = [
    parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ),
    parseAbiItem("event Mint(address indexed to, uint256 indexed tokenId)"),
    parseAbiItem(
      "event MintedNFT(address indexed to, uint256 indexed tokenId, uint256 price)"
    ),
  ];

  const logs = await Promise.all(
    eventSignatures.map((signature) =>
      client
        .getLogs({
          address,
          event: signature,
          fromBlock: 0n,
          toBlock: "latest",
        })
        .catch(() => [])
    )
  );

  return logs.flat();
}
