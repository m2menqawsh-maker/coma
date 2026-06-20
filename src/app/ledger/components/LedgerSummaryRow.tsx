interface Props {
	entriesLength: number;
	totalIn: number;
	totalOut: number;
	formatAmount: (n: number) => string;
}

export default function LedgerSummaryRow({
	entriesLength,
	totalIn,
	totalOut,
	formatAmount,
}: Props) {
	if (entriesLength === 0) return null;

	return (
		<div className="flex gap-3 mb-3">
			<div className="bg-green-400/10 border border-green-400/15 rounded-lg py-2 px-4 text-[13px]">
				<span className="text-[#6b6b8a]">دخل: </span>
				<span className="text-green-400 font-bold privacy-blur">
					₪{formatAmount(totalIn)}
				</span>
			</div>
			<div className="bg-red-400/10 border border-red-400/15 rounded-lg py-2 px-4 text-[13px]">
				<span className="text-[#6b6b8a]">خرج: </span>
				<span className="text-red-400 font-bold privacy-blur">
					₪{formatAmount(totalOut)}
				</span>
			</div>
			<div className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-[13px]">
				<span className="text-[#6b6b8a]">صافي: </span>
				<span
					className={`font-bold privacy-blur ${totalIn - totalOut >= 0 ? "text-green-400" : "text-red-400"}`}
				>
					₪{formatAmount(totalIn - totalOut)}
				</span>
			</div>
			<div className="mr-auto py-2 px-4 text-xs text-[#4a4a6a]">
				{entriesLength} قيد
			</div>
		</div>
	);
}
