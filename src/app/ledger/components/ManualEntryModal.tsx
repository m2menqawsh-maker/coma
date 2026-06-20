import type React from "react";
import type { LedgerDirection, LedgerTxType, PaymentChannel } from "../types";

interface BankAccount {
	id: string;
	name: string;
}

interface Props {
	showManual: boolean;
	setShowManual: (v: boolean) => void;
	manualForm: {
		date: string;
		tx_type: LedgerTxType;
		direction: LedgerDirection;
		channel: PaymentChannel;
		amount: string;
		description: string;
		bank_account_id: string;
	};
	setManualForm: React.Dispatch<React.SetStateAction<any>>;
	savingManual: boolean;
	handleAddManualClick: () => void;
	MANUAL_TX_TYPES: LedgerTxType[];
	TX_TYPE_LABELS: Record<LedgerTxType, string>;
	bankAccounts: BankAccount[];
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function ManualEntryModal({
	showManual,
	setShowManual,
	manualForm,
	setManualForm,
	savingManual,
	handleAddManualClick,
	MANUAL_TX_TYPES,
	TX_TYPE_LABELS,
	bankAccounts,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	if (!showManual) return null;

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[460px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">قيد يدوي</h2>

				<div className="flex flex-col gap-3.5">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								التاريخ
							</label>
							<input
								className={inputStyle}
								type="date"
								dir="ltr"
								value={manualForm.date}
								onChange={(e) =>
									setManualForm((f: any) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
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
								value={manualForm.amount}
								onChange={(e) =>
									setManualForm((f: any) => ({ ...f, amount: e.target.value }))
								}
								placeholder="0.00"
							/>
						</div>
					</div>

					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							نوع القيد
						</label>
						<select
							className={inputStyle}
							value={manualForm.tx_type}
							onChange={(e) =>
								setManualForm((f: any) => ({
									...f,
									tx_type: e.target.value as LedgerTxType,
								}))
							}
						>
							{MANUAL_TX_TYPES.map((t) => (
								<option key={t} value={t}>
									{TX_TYPE_LABELS[t]}
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الاتجاه
							</label>
							<select
								className={inputStyle}
								value={manualForm.direction}
								onChange={(e) =>
									setManualForm((f: any) => ({
										...f,
										direction: e.target.value as LedgerDirection,
									}))
								}
							>
								<option value="in">↓ دخل</option>
								<option value="out">↑ خرج</option>
							</select>
						</div>
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								القناة
							</label>
							<select
								className={inputStyle}
								value={manualForm.channel}
								onChange={(e) =>
									setManualForm((f: any) => ({
										...f,
										channel: e.target.value as PaymentChannel,
									}))
								}
							>
								<option value="cash">نقدي</option>
								<option value="bank">بنك</option>
							</select>
						</div>
					</div>

					{manualForm.channel === "bank" && (
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الحساب البنكي
							</label>
							<select
								className={inputStyle}
								value={manualForm.bank_account_id}
								onChange={(e) =>
									setManualForm((f: any) => ({
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
						<label className="text-xs text-[#9090b0] block mb-1.5">الوصف</label>
						<input
							className={inputStyle}
							value={manualForm.description}
							onChange={(e) =>
								setManualForm((f: any) => ({
									...f,
									description: e.target.value,
								}))
							}
							placeholder="وصف القيد..."
						/>
					</div>
				</div>

				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={() => setShowManual(false)}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingManual ? "opacity-60" : "opacity-100"}`}
						onClick={handleAddManualClick}
						disabled={
							savingManual ||
							!manualForm.amount ||
							!manualForm.description.trim()
						}
					>
						{savingManual ? "جاري الحفظ..." : "تسجيل القيد"}
					</button>
				</div>
			</div>
		</div>
	);
}
