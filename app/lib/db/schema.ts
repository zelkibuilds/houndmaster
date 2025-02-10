import { sql } from "drizzle-orm";
import { text, boolean, timestamp, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contracts = pgTable("contracts", {
  id: text("id").primaryKey(), // Will be address_chain
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
});

export const contractSourceCode = pgTable("contract_source_code", {
  contract_id: text("contract_id")
    .primaryKey()
    .references(() => contracts.id),
  source_code: text("source_code").notNull(),
  constructor_arguments: text("constructor_arguments"),
  evm_version: text("evm_version"),
  fetched_at: timestamp("fetched_at").defaultNow(),
});

export const contractAbis = pgTable("contract_abis", {
  contract_id: text("contract_id")
    .primaryKey()
    .references(() => contracts.id),
  abi: text("abi").notNull(),
  fetched_at: timestamp("fetched_at").defaultNow(),
});

export const websiteAnalysis = pgTable("website_analysis", {
  contract_id: text("contract_id")
    .primaryKey()
    .references(() => contracts.id),
  project_description: text("project_description"),
  roadmap: text("roadmap"),
  services_analysis: text("services_analysis"),
  confidence: text("confidence").notNull(),
  analyzed_at: timestamp("analyzed_at").defaultNow(),
  source_urls: text("source_urls").notNull(),
  raw_content: text("raw_content").notNull(),
});

export const contractRelations = relations(contracts, ({ one }) => ({
  sourceCode: one(contractSourceCode, {
    fields: [contracts.id],
    references: [contractSourceCode.contract_id],
  }),
  abi: one(contractAbis, {
    fields: [contracts.id],
    references: [contractAbis.contract_id],
  }),
  websiteAnalysis: one(websiteAnalysis, {
    fields: [contracts.id],
    references: [websiteAnalysis.contract_id],
  }),
}));

export const contractSourceCodeRelations = relations(
  contractSourceCode,
  ({ one }) => ({
    contract: one(contracts, {
      fields: [contractSourceCode.contract_id],
      references: [contracts.id],
    }),
  })
);

export const contractAbisRelations = relations(contractAbis, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractAbis.contract_id],
    references: [contracts.id],
  }),
}));

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
