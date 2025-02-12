import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getContract } from "~/lib/db/queries.server";
import { type Address, parseAbiItem, type AbiEvent } from "viem";
import type { Chain } from "~/config/chains";
import {
  getContractSupply,
  getContractEvents,
} from "./contract-interactions.server";
import { getContractData } from "~/lib/requests/api/contract-data";
import { analyzeWebsite } from "./website-scraper.server";

const genAI = google("gemini-2.0-flash-001");

type MintAnalysisResult = {
  totalRaised: string | null;
  currency: string | null;
  confidence: "high" | "medium" | "low";
  explanation: string;
  missingInfo?: string[];
  mintCount?: number;
  averageMintPrice?: string | null;
};

type ProjectAnalysisResult = {
  contractAnalysis: MintAnalysisResult;
  websiteAnalysis?: {
    project_description: string;
    roadmap: string | null;
    services_analysis: string;
    confidence: "high" | "medium" | "low";
  };
};

function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code block syntax and any language identifier
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  return text;
}

export async function analyzeMintRevenue(
  address: Address,
  chain: Chain,
  projectUrl?: string
): Promise<ProjectAnalysisResult> {
  // Run contract analysis
  const contractAnalysis = await analyzeContract(address, chain);

  // If we have a project URL, run website analysis in parallel
  let websiteAnalysis: ProjectAnalysisResult["websiteAnalysis"];
  if (projectUrl) {
    try {
      websiteAnalysis = await analyzeWebsite(address, chain, projectUrl);
    } catch (error) {
      console.error("Failed to analyze website:", error);
    }
  }

  return {
    contractAnalysis,
    websiteAnalysis,
  };
}

// Move existing analyzeMintRevenue logic to this function
async function analyzeContract(
  address: Address,
  chain: Chain
): Promise<MintAnalysisResult> {
  // 1. First try to analyze from contract source code
  const contract = await getContract(address, chain);
  if (!contract?.sourceCode || !contract.abi) {
    return {
      totalRaised: null,
      currency: null,
      confidence: "low",
      explanation: "No verified source code or ABI found",
      missingInfo: ["verified contract source code", "contract ABI"],
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

    Return ONLY the JSON, no other text.
  `;

  const { text: sourceCodeResponse } = await generateText({
    model: genAI,
    prompt: sourceCodePrompt,
  });
  const sourceCodeAnalysis = JSON.parse(
    extractJsonFromMarkdown(sourceCodeResponse)
  );

  // If we have high confidence in source code analysis and fixed price
  if (
    sourceCodeAnalysis.confidence === "high" &&
    !sourceCodeAnalysis.isVariablePrice &&
    sourceCodeAnalysis.mintPrice
  ) {
    // Try to get supply from contract
    const abi = JSON.parse(contract.abi.abi);
    const supply = await getContractSupply(address, chain, abi);

    if (supply !== null) {
      // Parse the mint price, handling units
      const priceMatch = sourceCodeAnalysis.mintPrice.match(
        /^(\d*\.?\d+)\s*(ether|eth)?$/i
      );
      if (!priceMatch) {
        return {
          totalRaised: null,
          currency: sourceCodeAnalysis.currency,
          confidence: "low",
          explanation: `Could not parse mint price format: ${sourceCodeAnalysis.mintPrice}`,
        };
      }

      // Convert price to wei first (1 ether = 1e18 wei)
      const [whole, decimal = ""] = priceMatch[1].split(".");
      const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);
      const priceInWei = BigInt(whole + paddedDecimal);
      const totalRaised = supply * priceInWei;

      return {
        totalRaised: totalRaised.toString(),
        currency: sourceCodeAnalysis.currency,
        confidence: "high",
        explanation: `Calculated from fixed mint price of ${sourceCodeAnalysis.mintPrice} * supply of ${supply}`,
      };
    }
  }

  // If we need more data, look for mint events
  const eventSignatures = [
    // Standard ERC721 transfers from zero address (mints)
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    // Common mint event patterns
    "event Mint(address indexed to, uint256 indexed tokenId)",
    "event MintedNFT(address indexed to, uint256 indexed tokenId, uint256 price)",
    // Sale events that often accompany mints
    "event Sale(address indexed buyer, uint256 indexed tokenId, uint256 price)",
    "event Purchase(address indexed buyer, uint256 quantity, uint256 price)",
    // Public sale events
    "event PublicSaleMint(address indexed minter, uint256 indexed tokenId, uint256 price)",
    "event PrimaryMint(address indexed to, uint256 indexed tokenId, uint256 price)",
    // Batch mint events
    "event BatchMint(address indexed to, uint256[] tokenIds)",
    "event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)",
  ];

  const events = eventSignatures.map((sig) => parseAbiItem(sig) as AbiEvent);
  const mintEvents = await getContractEvents(address, chain, events);

  if (mintEvents && mintEvents.length > 0) {
    // Analyze mint events with Gemini
    const eventsPrompt = `
      Analyze these mint events and tell me the total amount raised.
      Focus on:
      1. Transfer events from zero address (these are mints)
      2. Direct mint events with price information
      3. Sale events that coincide with mints
      4. Look for patterns in batch mints
      
      Events: ${JSON.stringify(mintEvents)}
      Previous source code analysis: ${JSON.stringify(sourceCodeAnalysis)}
      
      Format response as JSON:
      {
        "totalRaised": string,
        "currency": string,
        "confidence": "high" | "medium" | "low",
        "explanation": string,
        "mintCount": number,
        "averageMintPrice": string | null
      }

      Return ONLY the JSON, no other text.
    `;

    const { text: eventsResponse } = await generateText({
      model: genAI,
      prompt: eventsPrompt,
    });
    return JSON.parse(extractJsonFromMarkdown(eventsResponse));
  }

  // If we still can't determine
  const missingInfo: string[] = [];

  if (!contract?.sourceCode) {
    missingInfo.push("verified contract source code");
  }

  if (!contract?.abi) {
    missingInfo.push("contract ABI");
  }

  if (mintEvents.length === 0) {
    missingInfo.push("mint event logs");
  }

  if (sourceCodeAnalysis?.mintPrice === null) {
    missingInfo.push("mint price definition");
  }

  const supply = contract?.abi
    ? await getContractSupply(address, chain, JSON.parse(contract.abi.abi))
    : null;
  if (supply === null) {
    missingInfo.push("total supply data");
  }

  return {
    totalRaised: null,
    currency: sourceCodeAnalysis?.currency || null,
    confidence: "low",
    explanation: "Could not determine total raised from available data",
    missingInfo,
  };
}
