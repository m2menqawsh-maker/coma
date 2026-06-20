interface BankBalance {
	id: string;
	name: string;
	account_type: string;
	balance: number;
}

interface Props {
	cashBalance: number;
	bankBalances: BankBalance[];
	totalBank: number;
	formatAmount: (n: number) => string;
}

export default function LedgerBalanceCards({
	cashBalance,
	bankBalances,
	totalBank,
	formatAmount,
}: Props) {
	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 mb-6">
			{/* Cash */}
			<div className="bg-[#111118] rounded-[14px] py-4 px-5 border border-white/5">
				<div className="text-[11px] text-[#6b6b8a] mb-1.5 uppercase tracking-wide">
					الخزينة
				</div>
				<div
					className={`text-[22px] font-bold transition-all duration-300 privacy-blur ${cashBalance >= 0 ? "text-green-400" : "text-red-400"}`}
				>
					₪{formatAmount(cashBalance)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1">نقدي</div>
			</div>

			{/* Bank accounts */}
			{bankBalances.map((b) => (
				<div
					key={b.id}
					className="bg-[#111118] rounded-[14px] py-4 px-5 border border-white/5"
				>
					<div className="text-[11px] text-[#6b6b8a] mb-1.5 uppercase tracking-wide">
						بنك
					</div>
					<div
						className={`text-[22px] font-bold transition-all duration-300 privacy-blur ${b.balance >= 0 ? "text-blue-400" : "text-red-400"}`}
					>
						₪{formatAmount(b.balance)}
					</div>
					<div className="text-[11px] text-[#4a4a6a] mt-1">{b.name}</div>
				</div>
			))}

			{/* Total bank */}
			{bankBalances.length > 1 && (
				<div className="bg-indigo-500/10 rounded-[14px] py-4 px-5 border border-indigo-500/20">
					<div className="text-[11px] text-[#6b6b8a] mb-1.5 uppercase tracking-wide">
						إجمالي البنوك
					</div>
					<div className="text-[22px] font-bold text-indigo-400 transition-all duration-300 privacy-blur">
						₪{formatAmount(totalBank)}
					</div>
					<div className="text-[11px] text-[#4a4a6a] mt-1">كل الحسابات</div>
				</div>
			)}
		</div>
	);
}
