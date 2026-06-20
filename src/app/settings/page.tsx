"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import BanksTab from "./components/BanksTab";
import PackagesTab from "./components/PackagesTab";
import PartnersTab from "./components/PartnersTab";
import PricingTab from "./components/PricingTab";
import ProductsTab from "./components/ProductsTab";
import type { Tab } from "./types";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<Tab>("pricing");

	const tabs: { id: Tab; label: string }[] = [
		{ id: "pricing", label: "التسعير" },
		{ id: "packages", label: "البكجات" },
		{ id: "partners", label: "الشركاء" },
		{ id: "banks", label: "الحسابات البنكية" },
		{ id: "products", label: "المنتجات" },
	];

	return (
		<AppLayout>
			<div className="p-7 max-w-[720px] w-full">
				<h1 className="text-xl font-bold text-[#f0f0f8] mb-6">الإعدادات</h1>

				{/* Tabs */}
				<div className="flex gap-1 mb-7 bg-[#111118] rounded-xl p-1">
					{tabs.map((t) => (
						<button
							key={t.id}
							onClick={() => setActiveTab(t.id)}
							className={`flex-1 py-2 rounded-lg border-none text-[13px] cursor-pointer transition-all duration-150 ${
								activeTab === t.id
									? "bg-indigo-500/20 text-indigo-400 font-semibold"
									: "bg-transparent text-[#6b6b8a] font-normal hover:bg-white/5"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				{activeTab === "pricing" && <PricingTab />}
				{activeTab === "packages" && <PackagesTab />}
				{activeTab === "partners" && <PartnersTab />}
				{activeTab === "banks" && <BanksTab />}
				{activeTab === "products" && <ProductsTab />}
			</div>
		</AppLayout>
	);
}
