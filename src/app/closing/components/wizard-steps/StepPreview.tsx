import type { PreviewData, Step } from "../../types";
import { btnPrimary, btnSecondary, fmt, fmtDate } from "../../utils";

interface Props {
	periodFrom: string;
	periodTo: string;
	previewData: PreviewData;
	setStep: (s: Step) => void;
}

export default function StepPreview({
	periodFrom,
	periodTo,
	previewData,
	setStep,
}: Props) {
	return (
		<div className="flex flex-col gap-[18px]">
			<div>
				<div className="text-base font-bold text-[#f0f0f8] mb-1">
					ملخص الفترة
				</div>
				<div className="text-[13px] text-[#6b6b8a]">
					{fmtDate(periodFrom)} — {fmtDate(periodTo)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{[
					{
						label: "إجمالي الإيراد",
						value: previewData.revenue,
						color: "text-indigo-400",
						sub: `${previewData.invoiceCount} فاتورة`,
					},
					{
						label: "صافي الربح",
						value: previewData.netProfit,
						color: "text-green-400",
						sub: `${
							previewData.revenue > 0
								? ((previewData.netProfit / previewData.revenue) * 100).toFixed(
										1,
									)
								: 0
						}% هامش`,
					},
					{
						label: "إجمالي المصاريف",
						value: previewData.expenses,
						color: "text-red-400",
						sub: "تشغيلية ومشتريات",
					},
					{
						label: "ديون العملاء",
						value: previewData.debtRevenue,
						color: "text-amber-400",
						sub: "غير محصّل بعد",
					},
				].map((k) => (
					<div
						key={k.label}
						className="bg-white/5 rounded-xl py-3.5 px-[18px] border border-white/5"
					>
						<div className="text-[11px] text-[#6b6b8a] mb-1.5">{k.label}</div>
						<div
							className={`text-[22px] font-bold privacy-blur transition-all duration-300 ${k.color}`}
						>
							₪{fmt(k.value)}
						</div>
						<div className="text-[11px] text-[#4a4a6a] mt-1">{k.sub}</div>
					</div>
				))}
			</div>

			<div className="bg-white/5 rounded-xl py-3.5 px-[18px] border border-white/5">
				<div className="text-xs font-semibold text-[#9090b0] mb-3">التحصيل</div>
				{[
					{
						label: "نقدي",
						value: previewData.cashRevenue,
						color: "text-amber-400",
					},
					{
						label: "بنك",
						value: previewData.bankRevenue,
						color: "text-blue-400",
					},
					{
						label: "ديون",
						value: previewData.debtRevenue,
						color: "text-red-400",
					},
				].map((r) => (
					<div key={r.label} className="flex justify-between mb-1.5">
						<span className="text-xs text-[#9090b0]">{r.label}</span>
						<span
							className={`text-[13px] font-bold privacy-blur transition-all duration-300 ${r.color}`}
						>
							₪{fmt(r.value)}
						</span>
					</div>
				))}
			</div>

			<div className="flex gap-2.5">
				<button className={btnSecondary} onClick={() => setStep("period")}>
					← رجوع
				</button>
				<button
					className={`${btnPrimary} flex-1`}
					onClick={() => setStep("deductions")}
				>
					الخصومات ←
				</button>
			</div>
		</div>
	);
}
