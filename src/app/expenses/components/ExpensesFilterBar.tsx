import type { ExpenseType } from "../types";
import { EXPENSE_TYPE_LABELS } from "../utils";

interface Props {
	filterType: "all" | ExpenseType;
	setFilterType: (val: "all" | ExpenseType) => void;
	filterDateFrom: string;
	setFilterDateFrom: (val: string) => void;
	filterDateTo: string;
	setFilterDateTo: (val: string) => void;
	onExportCsv: () => void;
	inputStyle: string;
	btnSecondary: string;
}

export default function ExpensesFilterBar({
	filterType,
	setFilterType,
	filterDateFrom,
	setFilterDateFrom,
	filterDateTo,
	setFilterDateTo,
	onExportCsv,
	inputStyle,
	btnSecondary,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-[14px] p-4 border border-white/5 mb-4">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1">النوع</label>
					<select
						className={inputStyle}
						value={filterType}
						onChange={(e) => setFilterType(e.target.value as typeof filterType)}
					>
						<option value="all">الكل</option>
						{(
							Object.entries(EXPENSE_TYPE_LABELS) as [ExpenseType, string][]
						).map(([k, v]) => (
							<option key={k} value={k}>
								{v}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1">
						من تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={filterDateFrom}
						onChange={(e) => setFilterDateFrom(e.target.value)}
					/>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1">
						إلى تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={filterDateTo}
						onChange={(e) => setFilterDateTo(e.target.value)}
					/>
				</div>
				<div className="flex items-end gap-2">
					<button
						onClick={() => {
							setFilterType("all");
							setFilterDateFrom("");
							setFilterDateTo("");
						}}
						className={`${btnSecondary} flex-1 text-xs`}
					>
						مسح الفلاتر
					</button>
					<button
						onClick={onExportCsv}
						className="py-[9px] px-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg cursor-pointer font-semibold text-xs flex items-center gap-1.5"
						title="تصدير Excel"
					>
						<span>📊</span> تصدير
					</button>
				</div>
			</div>
		</div>
	);
}
