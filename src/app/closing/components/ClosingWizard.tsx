"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
	DeductionRow,
	Obligation,
	Partner,
	PartnerRow,
	PreviewData,
	Step,
} from "../types";
import { DAYS_IN_PERIOD, STEPS } from "../utils";
import StepConfirm from "./wizard-steps/StepConfirm";
import StepDeductions from "./wizard-steps/StepDeductions";
import StepPartners from "./wizard-steps/StepPartners";
import StepPeriod from "./wizard-steps/StepPeriod";
import StepPreview from "./wizard-steps/StepPreview";

const supabase = createClient();

interface Props {
	partners: Partner[];
	obligations: Obligation[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function ClosingWizard({
	partners,
	obligations,
	onClose,
	onSuccess,
	onError,
}: Props) {
	const [step, setStep] = useState<Step>("period");
	const [periodFrom, setPeriodFrom] = useState(() => {
		const d = new Date();
		d.setDate(1);
		return d.toISOString().split("T")[0];
	});
	const [periodTo, setPeriodTo] = useState(
		() => new Date().toISOString().split("T")[0],
	);
	const [label, setLabel] = useState("");

	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	const [deductions, setDeductions] = useState<DeductionRow[]>([]);
	const [partnerRows, setPartnerRows] = useState<PartnerRow[]>([]);

	const [saving, setSaving] = useState(false);

	const [newDeductLabel, setNewDeductLabel] = useState("");
	const [newDeductAmount, setNewDeductAmount] = useState("");

	const stepIndex = STEPS.findIndex((s) => s.id === step);

	const loadPreview = async () => {
		setLoadingPreview(true);
		const [{ data: invoices }, { data: expenses }] = await Promise.all([
			supabase
				.from("invoices")
				.select("total_due, net_profit, cash_paid, bank_paid, debt_created")
				.gte("session_end", periodFrom)
				.lte("session_end", `${periodTo}T23:59:59`),
			supabase
				.from("expenses")
				.select("cash_amount, bank_amount")
				.gte("date", periodFrom)
				.lte("date", periodTo),
		]);

		const inv =
			(invoices as {
				total_due: number;
				net_profit: number;
				cash_paid: number;
				bank_paid: number;
				debt_created: number;
			}[]) || [];
		const exp =
			(expenses as { cash_amount: number; bank_amount: number }[]) || [];

		const revenue = inv.reduce((s, i) => s + i.total_due, 0);
		const cashRevenue = inv.reduce((s, i) => s + i.cash_paid, 0);
		const bankRevenue = inv.reduce((s, i) => s + i.bank_paid, 0);
		const debtRevenue = inv.reduce((s, i) => s + i.debt_created, 0);
		const expTotal = exp.reduce((s, e) => s + e.cash_amount + e.bank_amount, 0);
		const netProfit = inv.reduce((s, i) => s + i.net_profit, 0);

		setPreviewData({
			revenue,
			cashRevenue,
			bankRevenue,
			debtRevenue,
			expenses: expTotal,
			netProfit,
			invoiceCount: inv.length,
		});

		const days = Math.max(
			1,
			Math.round(
				(new Date(periodTo).getTime() - new Date(periodFrom).getTime()) /
					86400000,
			) + 1,
		);
		const oblDeductions: DeductionRow[] = obligations.map((o) => {
			const dailyRate = o.amount / DAYS_IN_PERIOD[o.schedule_type];
			const calculated = Math.round(dailyRate * days * 100) / 100;
			return {
				id: o.id,
				label: o.name,
				calculated,
				approved: false,
				actual_amount: calculated,
				type: "obligation",
			};
		});
		setDeductions(oblDeductions);

		setPartnerRows(
			partners.map((p) => ({
				id: p.id,
				name: p.name,
				percent: p.share_percent,
				share: Math.round(netProfit * (p.share_percent / 100) * 100) / 100,
				actual_deducted: 0,
			})),
		);

		setLoadingPreview(false);
		setStep("preview");
	};

	const totalApprovedDeductions = deductions
		.filter((d) => d.approved)
		.reduce((s, d) => s + d.actual_amount, 0);

	const netAfterDeductions =
		(previewData?.netProfit || 0) - totalApprovedDeductions;

	const handleSave = async () => {
		if (!previewData) return;
		setSaving(true);

		const { data: closing, error } = await supabase
			.from("financial_closings")
			.insert({
				period_from: periodFrom,
				period_to: periodTo,
				label: label.trim() || null,
				total_revenue: previewData.revenue,
				total_expenses: previewData.expenses,
				total_obligations: totalApprovedDeductions,
				net_profit: previewData.netProfit,
				partners_snapshot: partnerRows,
				approved_deductions: deductions,
				locked: true,
			})
			.select()
			.single();

		if (error) {
			onError(`فشل حفظ الجرد: ${error.message}`);
			setSaving(false);
			return;
		}

		await supabase.from("period_locks").insert({
			locked_until: periodTo,
			closing_id: closing.id,
		});

		onSuccess("تم إنشاء الجرد وقفل الفترة ✓");
		setSaving(false);
	};

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
			<div className="bg-[#111118] rounded-[20px] w-full max-w-[680px] max-h-[92vh] overflow-y-auto border border-white/10">
				{/* Wizard header */}
				<div className="py-[22px] px-7 border-b border-white/5">
					<div className="flex justify-between items-center mb-[18px]">
						<h2 className="text-[17px] font-bold text-[#f0f0f8]">
							جرد مالي جديد
						</h2>
						<button
							onClick={onClose}
							className="bg-transparent border-none text-[#6b6b8a] text-lg cursor-pointer"
						>
							✕
						</button>
					</div>

					<div className="flex gap-0">
						{STEPS.map((s, i) => (
							<div key={s.id} className="flex items-center flex-1">
								<div className="flex flex-col items-center flex-1">
									<div
										className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
											i < stepIndex
												? "bg-green-400 text-white"
												: i === stepIndex
													? "bg-indigo-500 text-white"
													: "bg-white/5 text-[#4a4a6a]"
										}`}
									>
										{i < stepIndex ? "✓" : i + 1}
									</div>
									<div
										className={`text-[10px] whitespace-nowrap ${
											i === stepIndex ? "text-indigo-400" : "text-[#4a4a6a]"
										}`}
									>
										{s.label}
									</div>
								</div>
								{i < STEPS.length - 1 && (
									<div
										className={`h-[2px] flex-1 mb-[18px] ${
											i < stepIndex ? "bg-green-400" : "bg-white/5"
										}`}
									/>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="py-6 px-7">
					{step === "period" && (
						<StepPeriod
							periodFrom={periodFrom}
							setPeriodFrom={setPeriodFrom}
							periodTo={periodTo}
							setPeriodTo={setPeriodTo}
							label={label}
							setLabel={setLabel}
							onClose={onClose}
							loadPreview={loadPreview}
							loadingPreview={loadingPreview}
						/>
					)}

					{step === "preview" && previewData && (
						<StepPreview
							periodFrom={periodFrom}
							periodTo={periodTo}
							previewData={previewData}
							setStep={setStep}
						/>
					)}

					{step === "deductions" && (
						<StepDeductions
							deductions={deductions}
							setDeductions={setDeductions}
							newDeductLabel={newDeductLabel}
							setNewDeductLabel={setNewDeductLabel}
							newDeductAmount={newDeductAmount}
							setNewDeductAmount={setNewDeductAmount}
							totalApprovedDeductions={totalApprovedDeductions}
							netAfterDeductions={netAfterDeductions}
							partners={partners}
							setPartnerRows={setPartnerRows}
							setStep={setStep}
						/>
					)}

					{step === "partners" && (
						<StepPartners
							partnerRows={partnerRows}
							setPartnerRows={setPartnerRows}
							netAfterDeductions={netAfterDeductions}
							setStep={setStep}
						/>
					)}

					{step === "confirm" && previewData && (
						<StepConfirm
							periodFrom={periodFrom}
							periodTo={periodTo}
							previewData={previewData}
							totalApprovedDeductions={totalApprovedDeductions}
							netAfterDeductions={netAfterDeductions}
							partnerRows={partnerRows}
							saving={saving}
							setStep={setStep}
							handleSave={handleSave}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
