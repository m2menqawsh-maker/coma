"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import CustomersTab from "./components/CustomersTab";
import InvoicesTab from "./components/InvoicesTab";

export default function InvoicesPage() {
	const [activeTab, setActiveTab] = useState<"invoices" | "customers">(
		"invoices",
	);

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				{/* Header + Tabs */}
				<div className="mb-6">
					<h1 className="text-xl font-bold text-[#f0f0f8] mb-4">
						الفواتير والزبائن
					</h1>
					<div className="flex gap-1 bg-[#111118] rounded-lg p-1 w-fit">
						{(
							[
								{ id: "invoices", label: "الفواتير" },
								{ id: "customers", label: "الزبائن" },
							] as const
						).map((t) => (
							<button
								key={t.id}
								onClick={() => setActiveTab(t.id)}
								className={`py-2 px-6 rounded-lg border-none text-[13px] cursor-pointer transition-all duration-150 ${
									activeTab === t.id
										? "bg-indigo-400/20 text-indigo-400 font-semibold"
										: "bg-transparent text-[#6b6b8a] font-normal"
								}`}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				{activeTab === "invoices" && <InvoicesTab />}
				{activeTab === "customers" && <CustomersTab />}
			</div>
		</AppLayout>
	);
}
