import type React from "react";

interface BankBalance {
	id: string;
	name: string;
	balance: number;
}

interface Props {
	bankBalances: BankBalance[];
	totalBankBal: number;
	role: "admin" | "partner" | "viewer" | null;
	fmt: (n: unknown) => string;
	className?: string;
	navBtn: (label: string, href: string) => React.ReactNode;
}

export default function BankAccountsList({
	bankBalances,
	totalBankBal,
	role,
	fmt,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
	navBtn,
}: Props) {
	if (role === "viewer") return null;

	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15 flex justify-between items-center">
				<div className="text-sm font-bold text-white">الحسابات البنكية</div>
				{navBtn("الأستاذ", "/ledger")}
			</div>
			{bankBalances.length === 0 ? (
				<div className="py-7 px-5 text-center text-zinc-400 text-[13px] font-medium">
					لا توجد حسابات
				</div>
			) : (
				<div className="py-2">
					{bankBalances.map((b, i) => (
						<div
							key={b.id}
							className={`px-5 py-[11px] flex justify-between ${
								i < bankBalances.length - 1 ? "border-b border-white/10" : ""
							}`}
						>
							<div className="text-[13px] text-zinc-200 font-medium">
								{b.name}
							</div>
							<div
								className={`text-sm font-extrabold ${
									b.balance >= 0 ? "text-blue-400" : "text-red-300"
								}`}
							>
								₪{fmt(b.balance)}
							</div>
						</div>
					))}
					<div className="px-5 py-[11px] border-t border-white/15 flex justify-between">
						<span className="text-xs text-zinc-400 font-bold">المجموع</span>
						<span className="text-sm font-extrabold text-blue-400">
							₪{fmt(totalBankBal)}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
