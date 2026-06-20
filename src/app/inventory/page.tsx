"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import ItemsTab from "./components/ItemsTab";
import PurchaseTab from "./components/PurchaseTab";
import RecipesTab from "./components/RecipesTab";
import type { Tab } from "./types";

export default function InventoryPage() {
	const [activeTab, setActiveTab] = useState<Tab>("items");

	const tabs: { id: Tab; label: string }[] = [
		{ id: "items", label: "الأصناف" },
		{ id: "purchase", label: "تسجيل شراء" },
		{ id: "recipes", label: "وصفات المنتجات" },
	];

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				<h1 className="text-xl font-bold text-[#f0f0f8] mb-6">المخزون</h1>

				{/* Tabs */}
				<div className="flex gap-1 mb-7 bg-[#111118] rounded-xl p-1">
					{tabs.map((t) => (
						<button
							key={t.id}
							onClick={() => setActiveTab(t.id)}
							className={`flex-1 py-2 rounded-lg border-none text-[13px] cursor-pointer transition-all duration-150 ${
								activeTab === t.id
									? "bg-indigo-500/20 text-indigo-400 font-semibold"
									: "bg-transparent text-zinc-500 font-normal hover:bg-zinc-800/50"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{activeTab === "items" && <ItemsTab />}
				{activeTab === "purchase" && <PurchaseTab />}
				{activeTab === "recipes" && <RecipesTab />}
			</div>
		</AppLayout>
	);
}
