import type { ExpenseType } from "../types";
import { EXPENSE_TYPE_COLORS, EXPENSE_TYPE_LABELS, fmt } from "../utils";

interface Props {
	totalAll: number;
	totalCash: number;
	totalBank: number;
	expensesCount: number;
	totalByType: (type: ExpenseType) => number;
}

export default function ExpensesSummaryCards({
	totalAll,
	totalCash,
	totalBank,
	expensesCount,
	totalByType,
}: Props) {
	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 mb-6">
			<div className="bg-[#111118] rounded-[14px] p-[16px_20px] border border-white/5">
				<div className="text-[11px] text-[#6b6b8a] mb-1.5">إجمالي المصاريف</div>
				<div className="text-[22px] font-bold text-red-400 privacy-blur transition-all duration-300">
					₪{fmt(totalAll)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1">
					{expensesCount} قيد
				</div>
			</div>
			<div className="bg-[#111118] rounded-[14px] p-[16px_20px] border border-white/5">
				<div className="text-[11px] text-[#6b6b8a] mb-1.5">نقدي</div>
				<div className="text-[22px] font-bold text-amber-400 privacy-blur transition-all duration-300">
					₪{fmt(totalCash)}
				</div>
			</div>
			<div className="bg-[#111118] rounded-[14px] p-[16px_20px] border border-white/5">
				<div className="text-[11px] text-[#6b6b8a] mb-1.5">بنك</div>
				<div className="text-[22px] font-bold text-blue-400 privacy-blur transition-all duration-300">
					₪{fmt(totalBank)}
				</div>
			</div>
			{(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map((type) => {
				const total = totalByType(type);
				if (total === 0) return null;
				return (
					<div
						key={type}
						className={`bg-[#111118] rounded-[14px] p-[16px_20px] border ${EXPENSE_TYPE_COLORS[type].border}`}
					>
						<div className="text-[11px] text-[#6b6b8a] mb-1.5">
							{EXPENSE_TYPE_LABELS[type]}
						</div>
						<div
							className={`text-[20px] font-bold privacy-blur transition-all duration-300 ${EXPENSE_TYPE_COLORS[type].text}`}
						>
							₪{fmt(total)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
