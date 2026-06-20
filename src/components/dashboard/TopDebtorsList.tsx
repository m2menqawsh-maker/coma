import type React from "react";

interface DebtCustomer {
	id: string;
	name: string;
	balance: number;
}

interface Props {
	debtCustomers: DebtCustomer[];
	role: "admin" | "partner" | "viewer" | null;
	fmt: (n: unknown) => string;
	className?: string;
	navBtn: (label: string, href: string) => React.ReactNode;
}

export default function TopDebtorsList({
	debtCustomers,
	role,
	fmt,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
	navBtn,
}: Props) {
	if (role === "viewer") return null;

	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15 flex justify-between items-center">
				<div className="text-sm font-bold text-white">زبائن بديون</div>
				{navBtn("الفواتير", "/invoices")}
			</div>
			{debtCustomers.length === 0 ? (
				<div className="py-7 px-5 text-center">
					<div className="text-[22px] mb-2">✓</div>
					<div className="text-[13px] text-green-400 font-semibold">
						لا ديون مستحقة
					</div>
				</div>
			) : (
				debtCustomers.map((c, i) => (
					<div
						key={c.id}
						className={`px-5 py-2.5 flex justify-between items-center ${
							i < debtCustomers.length - 1 ? "border-b border-white/10" : ""
						}`}
					>
						<div className="text-[13px] text-white font-semibold">{c.name}</div>
						<div className="bg-red-400/10 border border-red-400/25 rounded-lg px-2.5 py-1 text-[13px] font-extrabold text-red-300">
							₪{fmt(Math.abs(c.balance))}
						</div>
					</div>
				))
			)}
		</div>
	);
}
