import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
	const envConfig = fs.readFileSync(envPath, "utf-8");
	envConfig.split("\n").forEach((line) => {
		const [key, value] = line.split("=");
		if (key && value) {
			process.env[key.trim()] = value.trim();
		}
	});
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase credentials");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUp() {
	console.log("Cleaning up E2E test data...");

	// 1. Delete Sessions
	const { error: sessionErr } = await supabase
		.from("sessions")
		.delete()
		.like("customer_name", "%E2E%");
	if (sessionErr) console.error("Error deleting sessions:", sessionErr.message);
	else console.log("Deleted E2E sessions.");

	// 2. Delete Customers
	const { error: custErr } = await supabase
		.from("customers")
		.delete()
		.like("name", "%E2E%");
	if (custErr) console.error("Error deleting customers:", custErr.message);
	else console.log("Deleted E2E customers.");

	// 3. Delete Expenses
	const { error: expErr } = await supabase
		.from("expenses")
		.delete()
		.like("name", "%E2E%");
	if (expErr) console.error("Error deleting expenses:", expErr.message);
	else console.log("Deleted E2E expenses.");

	// 4. Delete Ledger Entries
	const { error: ledgerErr } = await supabase
		.from("ledger_entries")
		.delete()
		.like("description", "%E2E%");
	if (ledgerErr)
		console.error("Error deleting ledger entries:", ledgerErr.message);
	else console.log("Deleted E2E ledger entries.");

	// 5. Delete Bank Transfers
	const { error: bankErr1 } = await supabase
		.from("bank_transfers")
		.delete()
		.like("description", "%E2E%");
	if (bankErr1)
		console.error("Error deleting bank transfers (desc):", bankErr1.message);
	const { error: bankErr2 } = await supabase
		.from("bank_transfers")
		.delete()
		.like("sender_name", "%E2E%");
	if (bankErr2)
		console.error("Error deleting bank transfers (sender):", bankErr2.message);
	else console.log("Deleted E2E bank transfers.");

	console.log("Cleanup complete!");
}

cleanUp();
