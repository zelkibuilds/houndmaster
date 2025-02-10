import { sql } from "drizzle-orm";
import {
  text,
  boolean,
  timestamp,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contracts = pgTable(
  "contracts",
  {
    address: text("address").notNull(),
    chain: text("chain").notNull(),
    name: text("name"),
    compiler_version: text("compiler_version"),
    optimization_used: boolean("optimization_used"),
    runs: text("runs"),
    license_type: text("license_type"),
    is_proxy: boolean("is_proxy"),
    implementation_address: text("implementation_address"),
    verified_at: timestamp("verified_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.address, table.chain] }),
  })
);

export const contractSourceCode = pgTable(
  "contract_source_code",
  {
    contract_address: text("contract_address").notNull(),
    contract_chain: text("contract_chain").notNull(),
    source_code: text("source_code").notNull(),
    constructor_arguments: text("constructor_arguments"),
    evm_version: text("evm_version"),
    fetched_at: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contract_address, table.contract_chain] }),
  })
);

export const contractAbis = pgTable(
  "contract_abis",
  {
    contract_address: text("contract_address").notNull(),
    contract_chain: text("contract_chain").notNull(),
    abi: text("abi").notNull(),
    fetched_at: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contract_address, table.contract_chain] }),
  })
);

export const websiteAnalysis = pgTable(
  "website_analysis",
  {
    contract_address: text("contract_address").notNull(),
    contract_chain: text("contract_chain").notNull(),
    project_description: text("project_description"),
    roadmap: text("roadmap"),
    services_analysis: text("services_analysis"),
    confidence: text("confidence").notNull(),
    analyzed_at: timestamp("analyzed_at").defaultNow(),
    source_urls: text("source_urls").notNull(),
    raw_content: text("raw_content").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contract_address, table.contract_chain] }),
  })
);

export const contractRelations = relations(contracts, ({ one }) => ({
  sourceCode: one(contractSourceCode, {
    fields: [contracts.address, contracts.chain],
    references: [
      contractSourceCode.contract_address,
      contractSourceCode.contract_chain,
    ],
  }),
  abi: one(contractAbis, {
    fields: [contracts.address, contracts.chain],
    references: [contractAbis.contract_address, contractAbis.contract_chain],
  }),
  websiteAnalysis: one(websiteAnalysis, {
    fields: [contracts.address, contracts.chain],
    references: [
      websiteAnalysis.contract_address,
      websiteAnalysis.contract_chain,
    ],
  }),
}));

export const contractSourceCodeRelations = relations(
  contractSourceCode,
  ({ one }) => ({
    contract: one(contracts, {
      fields: [
        contractSourceCode.contract_address,
        contractSourceCode.contract_chain,
      ],
      references: [contracts.address, contracts.chain],
    }),
  })
);

export const contractAbisRelations = relations(contractAbis, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractAbis.contract_address, contractAbis.contract_chain],
    references: [contracts.address, contracts.chain],
  }),
}));

export const websiteAnalysisRelations = relations(
  websiteAnalysis,
  ({ one }) => ({
    contract: one(contracts, {
      fields: [
        websiteAnalysis.contract_address,
        websiteAnalysis.contract_chain,
      ],
      references: [contracts.address, contracts.chain],
    }),
  })
);

// Types
export type Contract = typeof contracts.$inferSelect & {
  sourceCode?: ContractSourceCode;
  abi?: ContractAbi;
};
export type NewContract = typeof contracts.$inferInsert;

export type ContractSourceCode = typeof contractSourceCode.$inferSelect;
export type NewContractSourceCode = typeof contractSourceCode.$inferInsert;

export type ContractAbi = typeof contractAbis.$inferSelect;
export type NewContractAbi = typeof contractAbis.$inferInsert;
