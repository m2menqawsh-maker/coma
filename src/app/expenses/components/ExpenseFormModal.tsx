import type { BankAccount, ExpenseType } from "../types";
import { EXPENSE_TYPE_LABELS, fmt } from "../utils";

interface Props {
	title: string;
	form: {
		name: string;
		cash_amount: string;
		bank_amount: string;
		expense_type: ExpenseType;
		date: string;
		bank_account_id: string;
		notes: string;
	};
	setForm: React.Dispatch<
		React.SetStateAction<{
			name: string;
			cash_amount: string;
			bank_amount: string;
			expense_type: ExpenseType;
			date: string;
			bank_account_id: string;
			notes: string;
		}>
	>;
	bankAccounts: BankAccount[];
	saving: boolean;
	onClose: () => void;
	onSave: () => void;
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function ExpenseFormModal({
	title,
	form,
	setForm,
	bankAccounts,
	saving,
	onClose,
	onSave,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	const cashVal = parseFloat(form.cash_amount) || 0;
	const bankVal = parseFloat(form.bank_amount) || 0;
	const totalVal = cashVal + bankVal;

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[480px] border border-white/5">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">{title}</h2>

				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم المصروف
						</label>
						<input
							className={inputStyle}
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							placeholder="مثال: إيجار، كهرباء، مشتريات قهوة..."
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								نوع المصروف
							</label>
							<select
								className={inputStyle}
								value={form.expense_type}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										expense_type: e.target.value as ExpenseType,
									}))
								}
							>
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
							<label className="text-xs text-[#9090b0] block mb-1.5">
								التاريخ
							</label>
							<input
								className={inputStyle}
								type="date"
								dir="ltr"
								value={form.date}
								onChange={(e) =>
									setForm((f) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
					</div>

					{/* المبالغ */}
					<div className="bg-[#0d0d14] rounded-[10px] p-4 border border-white/5">
						<div className="text-xs text-[#6b6b8a] mb-3">
							المبالغ (اتركها 0 إذا ما فيها)
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-amber-400 block mb-1.5">
									نقدي (₪)
								</label>
								<input
									className={`${inputStyle} ${cashVal > 0 ? "border-amber-400/40" : ""}`}
									type="number"
									min="0"
									step="0.01"
									dir="ltr"
									value={form.cash_amount}
									onChange={(e) =>
										setForm((f) => ({ ...f, cash_amount: e.target.value }))
									}
									placeholder="0.00"
								/>
							</div>
							<div>
								<label className="text-xs text-blue-400 block mb-1.5">
									بنك (₪)
								</label>
								<input
									className={`${inputStyle} ${bankVal > 0 ? "border-blue-400/40" : ""}`}
									type="number"
									min="0"
									step="0.01"
									dir="ltr"
									value={form.bank_amount}
									onChange={(e) =>
										setForm((f) => ({ ...f, bank_amount: e.target.value }))
									}
									placeholder="0.00"
								/>
							</div>
						</div>
						{totalVal > 0 && (
							<div className="mt-2.5 py-2 px-3 bg-white/5 rounded-lg flex justify-between">
								<span className="text-xs text-[#6b6b8a]">الإجمالي</span>
								<span className="text-sm font-bold text-red-400">
									-₪{fmt(totalVal)}
								</span>
							</div>
						)}
					</div>

					{/* الحساب البنكي */}
					{bankVal > 0 && (
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الحساب البنكي
							</label>
							<select
								className={inputStyle}
								value={form.bank_account_id}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										bank_account_id: e.target.value,
									}))
								}
							>
								<option value="">-- اختر حساب --</option>
								{bankAccounts.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
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
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
							placeholder="أي تفاصيل إضافية..."
						/>
					</div>
				</div>

				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${saving ? "opacity-60" : "opacity-100"}`}
						onClick={onSave}
						disabled={saving || !form.name.trim() || totalVal <= 0}
					>
						{saving
							? "جاري الحفظ..."
							: `حفظ ${totalVal > 0 ? ` ₪${fmt(totalVal)}` : ""}`}
					</button>
				</div>
			</div>
		</div>
	);
}
