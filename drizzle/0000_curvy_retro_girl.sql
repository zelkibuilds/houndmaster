CREATE TABLE `contract_abis` (
	`contract_address` text NOT NULL,
	`chain` text NOT NULL,
	`abi` text NOT NULL,
	`fetched_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`contract_address`) REFERENCES `contracts`(`address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contract_source_code` (
	`contract_address` text NOT NULL,
	`chain` text NOT NULL,
	`source_code` text NOT NULL,
	`constructor_arguments` text,
	`evm_version` text,
	`fetched_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`contract_address`) REFERENCES `contracts`(`address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`address` text PRIMARY KEY NOT NULL,
	`chain` text NOT NULL,
	`name` text,
	`compiler_version` text,
	`optimization_used` integer,
	`runs` integer,
	`license_type` text,
	`is_proxy` integer,
	`implementation_address` text,
	`verified_at` text DEFAULT CURRENT_TIMESTAMP
);
