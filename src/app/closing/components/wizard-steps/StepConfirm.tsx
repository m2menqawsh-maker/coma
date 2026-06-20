import type { PartnerRow, PreviewData, Step } from "../../types";
import { btnPrimary, btnSecondary, fmt, fmtDate } from "../../utils";

interface Props {
	periodFrom: string;
	periodTo: string;
	previewData: PreviewData;
	totalApprovedDeductions: number;
	netAfterDeductions: number;
	partnerRows: PartnerRow[];
	saving: boolean;
	setStep: (s: Step) => void;
	handleSave: () => void;
}

export default function StepConfirm({
	periodFrom,
	periodTo,
	previewData,
	totalApprovedDeductions,
	netAfterDeductions,
	partnerRows,
	saving,
	setStep,
	handleSave,
}: Props) {
	return (
		<div className="flex flex-col gap-[18px]">
			<div>
				<div className="text-base font-bold text-[#f0f0f8] mb-1">
					مراجعة الجرد
				</div>
				<div className="text-[13px] text-[#6b6b8a]">
					راجع كل شيء قبل الإقفال — لا يمكن التراجع بعده
				</div>
			</div>

			<div className="bg-white/5 rounded-xl py-[18px] px-5 border border-white/5">
				<div className="text-[13px] font-semibold text-[#9090b0] mb-[14px]">
					ملخص الفترة
				</div>
				{[
					{
						label: "الفترة",
						value: `${fmtDate(periodFrom)} → ${fmtDate(periodTo)}`,
						color: "text-[#c0c0d8]",
					},
					{
						label: "إجمالي الإيراد",
						value: `₪${fmt(previewData.revenue)}`,
						color: "text-indigo-400",
					},
					{
						label: "المصاريف",
						value: `₪${fmt(previewData.expenses)}`,
						color: "text-red-400",
					},
					{
						label: "الخصومات المعتمدة",
						value: `₪${fmt(totalApprovedDeductions)}`,
						color: "text-orange-400",
					},
					{
						label: "صافي الربح النهائي",
						value: `₪${fmt(netAfterDeductions)}`,
						color: "text-green-400",
					},
				].map((r) => (
					<div
						key={r.label}
						className="flex justify-between py-[7px] border-b border-white/5"
					>
						<span className="text-[13px] text-[#9090b0]">{r.label}</span>
						<span
							className={`text-[13px] font-bold privacy-blur transition-all duration-300 ${r.color}`}
						>
							{r.value}
						</span>
					</div>
				))}
			</div>

			{partnerRows.length > 0 && (
				<div className="bg-white/5 rounded-xl py-[18px] px-5 border border-white/5">
					<div className="text-[13px] font-semibold text-[#9090b0] mb-[14px]">
						حصص الشركاء
					</div>
					{partnerRows.map((p) => (
						<div
							key={p.id}
							className="flex justify-between py-[7px] border-b border-white/5"
						>
							<div>
								<span className="text-[13px] text-[#e0e0f0] font-semibold">
									{p.name}
								</span>
								<span className="text-[11px] text-[#6b6b8a] mr-2">
									{p.percent}%
								</span>
							</div>
							<div className="text-left flex gap-5">
								<div>
									<span className="text-[11px] text-[#6b6b8a] ml-1">
										محسوب:
									</span>
									<span className="text-[13px] font-semibold text-indigo-400 privacy-blur transition-all duration-300">
										₪{fmt(p.share)}
									</span>
								</div>
								<div>
									<span className="text-[11px] text-[#6b6b8a] ml-1">
										مخصوم:
									</span>
									<span
										className={`text-[13px] font-semibold privacy-blur transition-all duration-300 ${p.actual_deducted > 0 ? "text-green-400" : "text-[#4a4a6a]"}`}
									>
										{p.actual_deducted > 0 ? `₪${fmt(p.actual_deducted)}` : "—"}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="bg-amber-400/10 border border-amber-400/25 rounded-xl py-[14px] px-[18px] text-[13px] text-amber-400">
				🔒 بعد التأكيد ستُقفل هذه الفترة ولن يمكن تعديل بياناتها
			</div>

			<div className="flex gap-2.5">
				<button className={btnSecondary} onClick={() => setStep("partners")}>
					← رجوع
				</button>
				<button
					className={`${btnPrimary} flex-1 bg-gradient-to-br from-green-500 to-green-600 border-none text-white ${saving ? "opacity-60" : "opacity-100"}`}
					onClick={handleSave}
					disabled={saving}
				>
					{saving ? "جاري الحفظ..." : "✓ تأكيد وإقفال الفترة"}
				</button>
			</div>
		</div>
	);
}
