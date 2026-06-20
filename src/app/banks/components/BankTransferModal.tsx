import type { BankAccountDetail, Direction } from "../types";

interface Props {
	accounts: BankAccountDetail[];
	addForm: {
		date: string;
		bank_account_id: string;
		amount: string;
		direction: Direction;
		description: string;
		sender_name: string;
		sender_phone: string;
	};
	setAddForm: React.Dispatch<
		React.SetStateAction<{
			date: string;
			bank_account_id: string;
			amount: string;
			direction: Direction;
			description: string;
			sender_name: string;
			sender_phone: string;
		}>
	>;
	onClose: () => void;
	onSave: () => void;
	saving: boolean;
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function BankTransferModal({
	accounts,
	addForm,
	setAddForm,
	onClose,
	onSave,
	saving,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[460px] border border-white/5">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					تسجيل حوالة يدوية
				</h2>
				<div className="bg-amber-400/[0.07] border border-amber-400/20 rounded-[10px] py-2.5 px-3.5 mb-4 text-xs text-amber-400">
					⚠ الحوالات الواردة تحتاج تصديقاً قبل احتسابها في الإيرادات
				</div>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							نوع الحوالة
						</label>
						<div className="flex gap-2">
							{(["in", "out"] as Direction[]).map((d) => (
								<button
									key={d}
									onClick={() => setAddForm((f) => ({ ...f, direction: d }))}
									className={`flex-1 py-2 rounded-lg text-[13px] cursor-pointer border-[1.5px] font-semibold ${
										addForm.direction === d
											? d === "in"
												? "border-green-400 bg-green-400/10 text-green-400"
												: "border-red-400 bg-red-400/10 text-red-400"
											: "border-[#2a2a3e] bg-[#1a1a26] text-[#6b6b8a] font-normal"
									}`}
								>
									{d === "in" ? "↓ وارد" : "↑ صادر"}
								</button>
							))}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								المبلغ (₪) *
							</label>
							<input
								className={`${inputStyle} ${
									addForm.direction === "in"
										? "border-green-400/30"
										: "border-red-400/30"
								}`}
								type="number"
								min="0.01"
								step="0.01"
								dir="ltr"
								value={addForm.amount}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, amount: e.target.value }))
								}
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								التاريخ
							</label>
							<input
								className={inputStyle}
								type="date"
								dir="ltr"
								value={addForm.date}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							الحساب البنكي *
						</label>
						<select
							className={inputStyle}
							value={addForm.bank_account_id}
							onChange={(e) =>
								setAddForm((f) => ({
									...f,
									bank_account_id: e.target.value,
								}))
							}
						>
							<option value="">-- اختر حساب --</option>
							{accounts.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name}
								</option>
							))}
						</select>
					</div>
					{addForm.direction === "in" && (
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									اسم المُرسِل
								</label>
								<input
									className={inputStyle}
									value={addForm.sender_name}
									onChange={(e) =>
										setAddForm((f) => ({
											...f,
											sender_name: e.target.value,
										}))
									}
									placeholder="اسم المُرسِل"
								/>
							</div>
							<div>
								<label className="text-xs text-[#9090b0] block mb-1.5">
									رقم هاتفه
								</label>
								<input
									className={inputStyle}
									value={addForm.sender_phone}
									dir="ltr"
									onChange={(e) =>
										setAddForm((f) => ({
											...f,
											sender_phone: e.target.value,
										}))
									}
									placeholder="05xxxxxxxx"
								/>
							</div>
						</div>
					)}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظة
						</label>
						<input
							className={inputStyle}
							value={addForm.description}
							onChange={(e) =>
								setAddForm((f) => ({ ...f, description: e.target.value }))
							}
							placeholder="وصف الحوالة..."
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${
							saving || !addForm.amount || !addForm.bank_account_id
								? "opacity-60"
								: "opacity-100"
						}`}
						onClick={onSave}
						disabled={saving || !addForm.amount || !addForm.bank_account_id}
					>
						{saving ? "جاري الحفظ..." : "تسجيل الحوالة"}
					</button>
				</div>
			</div>
		</div>
	);
}
