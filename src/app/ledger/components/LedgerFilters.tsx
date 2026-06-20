import type { LedgerDirection, LedgerTxType, PaymentChannel } from "../types";

interface Props {
	filterDirection: "all" | LedgerDirection;
	setFilterDirection: (v: "all" | LedgerDirection) => void;
	filterChannel: "all" | PaymentChannel;
	setFilterChannel: (v: "all" | PaymentChannel) => void;
	filterTxType: "all" | LedgerTxType;
	setFilterTxType: (v: "all" | LedgerTxType) => void;
	filterDateFrom: string;
	setFilterDateFrom: (v: string) => void;
	filterDateTo: string;
	setFilterDateTo: (v: string) => void;
	TX_TYPE_LABELS: Record<LedgerTxType, string>;
	inputStyle: string;
	btnSecondary: string;
}

export default function LedgerFilters({
	filterDirection,
	setFilterDirection,
	filterChannel,
	setFilterChannel,
	filterTxType,
	setFilterTxType,
	filterDateFrom,
	setFilterDateFrom,
	filterDateTo,
	setFilterDateTo,
	TX_TYPE_LABELS,
	inputStyle,
	btnSecondary,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-[14px] p-4 border border-white/5 mb-4">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						الاتجاه
					</label>
					<select
						className={inputStyle}
						value={filterDirection}
						onChange={(e) =>
							setFilterDirection(e.target.value as "all" | LedgerDirection)
						}
					>
						<option value="all">الكل</option>
						<option value="in">دخل</option>
						<option value="out">خرج</option>
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						القناة
					</label>
					<select
						className={inputStyle}
						value={filterChannel}
						onChange={(e) =>
							setFilterChannel(e.target.value as "all" | PaymentChannel)
						}
					>
						<option value="all">الكل</option>
						<option value="cash">نقدي</option>
						<option value="bank">بنك</option>
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						النوع
					</label>
					<select
						className={inputStyle}
						value={filterTxType}
						onChange={(e) =>
							setFilterTxType(e.target.value as "all" | LedgerTxType)
						}
					>
						<option value="all">الكل</option>
						{Object.entries(TX_TYPE_LABELS).map(([k, v]) => (
							<option key={k} value={k}>
								{v}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
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
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
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
				<div className="flex items-end">
					<button
						onClick={() => {
							setFilterDirection("all");
							setFilterChannel("all");
							setFilterTxType("all");
							setFilterDateFrom("");
							setFilterDateTo("");
						}}
						className={`${btnSecondary} w-full text-xs`}
					>
						مسح الفلاتر
					</button>
				</div>
			</div>
		</div>
	);
}
