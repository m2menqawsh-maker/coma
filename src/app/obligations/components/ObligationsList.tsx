import {
	calcObligationDailyRate,
	type ScheduleType,
} from "@/lib/finance/obligations";
import type { Obligation } from "../types";

interface Props {
	obligations: Obligation[];
	SCHEDULE_LABELS: Record<ScheduleType, string>;
	fmt: (n: unknown) => string;
	setEditObl: (o: Obligation) => void;
	setForm: (f: any) => void;
	setShowForm: (v: boolean) => void;
	handleToggle: (id: string, current: boolean) => void;
	btnSecondary: string;
}

export default function ObligationsList({
	obligations,
	SCHEDULE_LABELS,
	fmt,
	setEditObl,
	setForm,
	setShowForm,
	handleToggle,
	btnSecondary,
}: Props) {
	if (obligations.length === 0) {
		return (
			<div className="text-center py-[60px] px-5 bg-[#111118] rounded-[14px] border border-dashed border-white/5 text-[#4a4a6a] text-sm">
				لا توجد التزامات بعد
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2.5">
			{obligations.map((o) => {
				const dailyRate = calcObligationDailyRate(o.amount, o.schedule_type);
				return (
					<div
						key={o.id}
						className={`bg-[#111118] rounded-[14px] p-[16px_20px] flex justify-between items-center gap-4 border ${
							o.is_active
								? "border-white/5 opacity-100"
								: "border-white/[0.03] opacity-50"
						}`}
					>
						<div className="flex-1">
							<div className="flex items-center gap-2.5 mb-1.5">
								<span className="text-[15px] font-semibold text-[#e0e0f0]">
									{o.name}
								</span>
								<span className="text-[11px] py-[2px] px-2 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
									{SCHEDULE_LABELS[o.schedule_type]}
								</span>
							</div>
							<div className="flex gap-5">
								<div>
									<span className="text-[11px] text-[#4a4a6a]">المبلغ: </span>
									<span className="text-[13px] font-bold text-red-400 privacy-blur transition-all duration-300">
										₪{fmt(o.amount)}
									</span>
								</div>
								<div>
									<span className="text-[11px] text-[#4a4a6a]">يومياً: </span>
									<span className="text-[13px] font-semibold text-orange-400 privacy-blur transition-all duration-300">
										₪{fmt(dailyRate)}
									</span>
								</div>
								{o.notes && (
									<div className="text-[11px] text-[#4a4a6a]">{o.notes}</div>
								)}
							</div>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => {
									setEditObl(o);
									setForm({
										name: o.name,
										amount: String(o.amount),
										schedule_type: o.schedule_type,
										notes: o.notes || "",
									});
									setShowForm(true);
								}}
								className="bg-indigo-400/10 border border-indigo-400/20 rounded-[7px] text-indigo-400 py-1.5 px-[14px] text-xs cursor-pointer"
							>
								تعديل
							</button>
							<button
								onClick={() => handleToggle(o.id, o.is_active)}
								className={`${btnSecondary} py-1.5 px-[14px] text-xs ${
									o.is_active
										? "text-red-400 border-red-400/20"
										: "text-green-400 border-green-400/20"
								}`}
							>
								{o.is_active ? "تعطيل" : "تفعيل"}
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
