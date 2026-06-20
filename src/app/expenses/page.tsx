"use client";

import AppLayout from "@/components/AppLayout";
import ExpensesManager from "./components/ExpensesManager";

export default function ExpensesPage() {
	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1300px] mx-auto">
				<ExpensesManager />
			</div>
		</AppLayout>
	);
}
