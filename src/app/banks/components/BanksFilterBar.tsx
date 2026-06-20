import type { Direction, TransferStatus } from "../types";

interface Props {
	filterStatus: "all" | TransferStatus;
	setFilterStatus: (val: "all" | TransferStatus) => void;
	filterDir: "all" | Direction;
	setFilterDir: (val: "all" | Direction) => void;
	filterDateFrom: string;
	setFilterDateFrom: (val: string) => void;
	filterDateTo: string;
	setFilterDateTo: (val: string) => void;
	inputStyle: string;
	btnSecondary: string;
}

export default function BanksFilterBar({
	filterStatus,
	setFilterStatus,
	filterDir,
	setFilterDir,
	filterDateFrom,
	setFilterDateFrom,
	filterDateTo,
	setFilterDateTo,
	inputStyle,
	btnSecondary,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-[14px] p-[14px_18px] border border-white/5">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
				{[
					{
						label: "الحالة",
						node: (
							<select
								className={inputStyle}
								value={filterStatus}
								onChange={(e) =>
									setFilterStatus(e.target.value as "all" | TransferStatus)
								}
							>
								<option value="all">الكل</option>
								<option value="pending">معلّق</option>
								<option value="confirmed">مؤكد</option>
								<option value="rejected">مرفوض</option>
							</select>
						),
					},
					{
						label: "الاتجاه",
						node: (
							<select
								className={inputStyle}
								value={filterDir}
								onChange={(e) =>
									setFilterDir(e.target.value as "all" | Direction)
								}
							>
								<option value="all">الكل</option>
								<option value="in">وارد</option>
								<option value="out">صادر</option>
							</select>
						),
					},
					{
						label: "من تاريخ",
						node: (
							<input
								className={inputStyle}
								type="date"
								dir="ltr"
								value={filterDateFrom}
								onChange={(e) => setFilterDateFrom(e.target.value)}
							/>
						),
					},
					{
						label: "إلى تاريخ",
						node: (
							<input
								className={inputStyle}
								type="date"
								dir="ltr"
								value={filterDateTo}
								onChange={(e) => setFilterDateTo(e.target.value)}
							/>
						),
					},
				].map((f) => (
					<div key={f.label}>
						<label className="text-[11px] text-[#6b6b8a] block mb-1">
							{f.label}
						</label>
						{f.node}
					</div>
				))}
				<div className="flex items-end">
					<button
						onClick={() => {
							setFilterStatus("all");
							setFilterDir("all");
							setFilterDateFrom("");
							setFilterDateTo("");
						}}
						className={`${btnSecondary} w-full text-xs`}
					>
						مسح
					</button>
				</div>
			</div>
		</div>
	);
}
