# Houndmaster: NFT Collection Analysis Tool

## Overview

Houndmaster is a blockchain analysis tool that helps evaluate NFT collections across multiple chains. It combines on-chain data analysis and website content evaluation to provide key insights about NFT projects.

## Core Features

### Multi-Chain Collection Discovery

- Collection tracking across major chains (Ethereum, Base, Polygon)
- Filtering by volume and trading activity
- Collection categorization into recent and established projects

### Contract Analysis

- Mint revenue tracking
- Contract balance monitoring
- Verification status checking
- Mint count tracking

### Website Analysis

- Automated website content analysis using Google's Gemini AI
- Project roadmap extraction
- Service recommendations based on project needs
- Confidence scoring for analysis reliability
- Multi-page content aggregation through sitemap crawling

## How It Works

### Collection Discovery Process

1. Connects to Magic Eden's API for collection data
2. Filters collections based on:
   - Trading volume
   - Active trading indicators
   - Website availability
3. Organizes collections into recent and established categories
4. Shows floor price and weekly volume

### Analysis Pipeline

1. **Contract Analysis**

   - Fetches contract data from block explorers
   - Analyzes mint events
   - Tracks contract balances
   - Checks verification status

2. **Website Analysis**

   - Scrapes project websites using Playwright
   - Processes content through Gemini AI
   - Extracts:
     - Project description
     - Roadmap details
     - Team information

3. **Service Recommendations**
   - Suggests relevant services based on project needs:
     - Smart Contract Development
     - Web3 Design and UX
     - Full Stack Development
     - Community Management
     - DAO Setup

## Usage Guide

### Basic Navigation

1. **Chain Selection**

   - Select target blockchain
   - View chain-specific collection stats

2. **Collection Discovery**

   - Browse recent and established collections
   - Filter by:
     - Minimum volume
     - Website availability
   - View collection metrics

3. **Collection Analysis**
   - Select collections
   - Trigger analysis with "Release the Hounds"
   - View results in:
     - Trails Awaiting Investigation
     - Successful Hunts
     - Lost Trails

### Analysis Features

1. **Website Analysis**

   - View AI-generated insights
   - Read project descriptions
   - Check extracted roadmaps
   - Review service recommendations
   - View confidence scoring

2. **Contract Analysis**
   - View mint revenue data
   - Check contract balances
   - See verification status

## Conclusion

Houndmaster is a focused NFT collection analysis tool that combines on-chain data with AI insights. It helps users evaluate projects through automated website analysis and contract data tracking, providing a streamlined way to assess NFT collections.
