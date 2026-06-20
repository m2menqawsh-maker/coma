import type React from "react";
import {
	calcObligationDailyRate,
	type ScheduleType,
} from "@/lib/finance/obligations";
import type { Obligation } from "../types";

interface Props {
	showForm: boolean;
	setShowForm: (v: boolean) => void;
	editObl: Obligation | null;
	setEditObl: (o: Obligation | null) => void;
	form: {
		name: string;
		amount: string;
		schedule_type: ScheduleType;
		notes: string;
	};
	setForm: React.Dispatch<React.SetStateAction<any>>;
	saving: boolean;
	handleSave: () => void;
	fmt: (n: unknown) => string;
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function AddEditObligationModal({
	showForm,
	setShowForm,
	editObl,
	setEditObl,
	form,
	setForm,
	saving,
	handleSave,
	fmt,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	if (!showForm) return null;

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[440px] border border-white/5">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					{editObl ? "تعديل الالتزام" : "التزام ثابت جديد"}
				</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم الالتزام
						</label>
						<input
							className={inputStyle}
							value={form.name}
							onChange={(e) =>
								setForm((f: any) => ({ ...f, name: e.target.value }))
							}
							placeholder="مثال: إيجار، كهرباء، عامل..."
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								المبلغ (₪)
							</label>
							<input
								className={inputStyle}
								type="number"
								min="0.01"
								step="0.01"
								dir="ltr"
								value={form.amount}
								onChange={(e) =>
									setForm((f: any) => ({ ...f, amount: e.target.value }))
								}
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الدورية
							</label>
							<select
								className={inputStyle}
								value={form.schedule_type}
								onChange={(e) =>
									setForm((f: any) => ({
										...f,
										schedule_type: e.target.value as ScheduleType,
									}))
								}
							>
								<option value="monthly">شهري (÷30)</option>
								<option value="weekly">أسبوعي (÷7)</option>
								<option value="daily">يومي</option>
							</select>
						</div>
					</div>
					{/* Preview daily rate */}
					{form.amount && parseFloat(form.amount) > 0 && (
						<div className="bg-[#0d0d14] rounded-lg py-2.5 px-3.5 flex justify-between">
							<span className="text-xs text-[#6b6b8a]">التكلفة اليومية</span>
							<span className="text-sm font-bold text-orange-400">
								₪
								{fmt(
									calcObligationDailyRate(
										parseFloat(form.amount),
										form.schedule_type,
									),
								)}
								/يوم
							</span>
						</div>
					)}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظات (اختياري)
						</label>
						<input
							className={inputStyle}
							value={form.notes}
							onChange={(e) =>
								setForm((f: any) => ({ ...f, notes: e.target.value }))
							}
							placeholder="أي تفاصيل..."
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5">
					<button
						className={btnSecondary}
						onClick={() => {
							setShowForm(false);
							setEditObl(null);
						}}
					>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${saving ? "opacity-60" : "opacity-100"}`}
						onClick={handleSave}
						disabled={saving || !form.name.trim() || !form.amount}
					>
						{saving
							? "جاري الحفظ..."
							: editObl
								? "حفظ التعديلات"
								: "إضافة الالتزام"}
					</button>
				</div>
			</div>
		</div>
	);
}
