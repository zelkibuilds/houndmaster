import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(), // Will be address_chain
  address: text("address").notNull(),
  chain: text("chain").notNull(),
  name: text("name"),
  compiler_version: text("compiler_version"),
  optimization_used: integer("optimization_used", { mode: "boolean" }),
  runs: integer("runs"),
  license_type: text("license_type"),
  is_proxy: integer("is_proxy", { mode: "boolean" }),
  implementation_address: text("implementation_address"),
  verified_at: text("verified_at").default(sql`CURRENT_TIMESTAMP`),
});

export const contractSourceCode = sqliteTable("contract_source_code", {
  contract_id: text("contract_id")
    .primaryKey()
    .references(() => contracts.id),
  source_code: text("source_code").notNull(),
  constructor_arguments: text("constructor_arguments"),
  evm_version: text("evm_version"),
  fetched_at: text("fetched_at").default(sql`CURRENT_TIMESTAMP`),
});

export const contractAbis = sqliteTable("contract_abis", {
  contract_id: text("contract_id")
    .primaryKey()
    .references(() => contracts.id),
  abi: text("abi").notNull(),
  fetched_at: text("fetched_at").default(sql`CURRENT_TIMESTAMP`),
});

export const contractRelations = relations(contracts, ({ one }) => ({
  sourceCode: one(contractSourceCode),
  abi: one(contractAbis),
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
