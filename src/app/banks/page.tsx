"use client";

import AppLayout from "@/components/AppLayout";
import BanksManager from "./components/BanksManager";

export default function BankAccountsPage() {
	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto flex flex-col gap-5">
				<BanksManager />
			</div>
		</AppLayout>
	);
}
