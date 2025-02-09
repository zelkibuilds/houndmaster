import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const contracts = sqliteTable("contracts", {
  address: text("address").primaryKey(),
  chain: text("chain").notNull(),
  name: text("name"),
  compilerVersion: text("compiler_version"),
  optimizationUsed: integer("optimization_used", { mode: "boolean" }),
  runs: integer("runs"),
  licenseType: text("license_type"),
  isProxy: integer("is_proxy", { mode: "boolean" }),
  implementationAddress: text("implementation_address"),
  verifiedAt: text("verified_at").default(sql`CURRENT_TIMESTAMP`),
});

export const contractSourceCode = sqliteTable(
  "contract_source_code",
  {
    contractAddress: text("contract_address")
      .notNull()
      .references(() => contracts.address),
    chain: text("chain").notNull(),
    sourceCode: text("source_code").notNull(),
    constructorArguments: text("constructor_arguments"),
    evmVersion: text("evm_version"),
    fetchedAt: text("fetched_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: sql`PRIMARY KEY (${table.contractAddress}, ${table.chain})`,
  })
);

export const contractAbis = sqliteTable(
  "contract_abis",
  {
    contractAddress: text("contract_address")
      .notNull()
      .references(() => contracts.address),
    chain: text("chain").notNull(),
    abi: text("abi").notNull(),
    fetchedAt: text("fetched_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: sql`PRIMARY KEY (${table.contractAddress}, ${table.chain})`,
  })
);

// Types
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

export type ContractSourceCode = typeof contractSourceCode.$inferSelect;
export type NewContractSourceCode = typeof contractSourceCode.$inferInsert;

export type ContractAbi = typeof contractAbis.$inferSelect;
export type NewContractAbi = typeof contractAbis.$inferInsert;
