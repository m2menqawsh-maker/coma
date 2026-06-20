"use client";

import AppLayout from "@/components/AppLayout";
import PartnersManager from "./components/PartnersManager";

export default function PartnersPage() {
	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				<PartnersManager />
			</div>
		</AppLayout>
	);
}
