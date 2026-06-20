import type { BankAccount, Partner } from "../types";
import { fmt } from "../utils";

interface PartnerStats {
	profitShare: number;
	netBalance: number;
	totalDebt: number;
}

interface Props {
	modalPartner: Partner;
	form: {
		type: "withdrawal" | "deposit" | "loan" | "loan_payment";
		amount: string;
		channel: "cash" | "bank";
		bank_account_id: string;
		date: string;
		description: string;
	};
	setForm: React.Dispatch<
		React.SetStateAction<{
			type: "withdrawal" | "deposit" | "loan" | "loan_payment";
			amount: string;
			channel: "cash" | "bank";
			bank_account_id: string;
			date: string;
			description: string;
		}>
	>;
	bankAccounts: BankAccount[];
	getPartnerStats: (p: Partner) => PartnerStats;
	onClose: () => void;
	onSaveClick: () => void;
	saving: boolean;
	inputStyle: string;
	btnPrimary: string;
	btnSecondary: string;
}

export default function PartnerMovementModal({
	modalPartner,
	form,
	setForm,
	bankAccounts,
	getPartnerStats,
	onClose,
	onSaveClick,
	saving,
	inputStyle,
	btnPrimary,
	btnSecondary,
}: Props) {
	const stats = getPartnerStats(modalPartner);

	return (
		<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[440px] border border-white/5">
				{/* Modal header */}
				<div className="flex justify-between items-center mb-5">
					<div>
						<h2 className="text-base font-bold text-[#f0f0f8]">
							{form.type === "withdrawal" && "تسجيل سحب أرباح"}
							{form.type === "deposit" && "تسجيل إيداع أرباح"}
							{form.type === "loan" && "تسجيل أخذ سلفة"}
							{form.type === "loan_payment" && "تسجيل سداد سلفة"}
						</h2>
						<div className="text-xs text-[#6b6b8a] mt-1">
							{modalPartner.name}
						</div>
					</div>
					{/* Action Toggles */}
					<div className="flex gap-1.5 flex-wrap justify-end max-w-[200px]">
						<button
							onClick={() => setForm((f) => ({ ...f, type: "deposit" }))}
							className={`py-1 px-2 rounded text-[11px] cursor-pointer transition-colors ${
								form.type === "deposit"
									? "bg-green-400/20 text-green-400 font-bold"
									: "bg-white/5 text-[#6b6b8a] hover:bg-white/10"
							}`}
						>
							إيداع
						</button>
						<button
							onClick={() => setForm((f) => ({ ...f, type: "withdrawal" }))}
							className={`py-1 px-2 rounded text-[11px] cursor-pointer transition-colors ${
								form.type === "withdrawal"
									? "bg-red-400/20 text-red-400 font-bold"
									: "bg-white/5 text-[#6b6b8a] hover:bg-white/10"
							}`}
						>
							سحب أرباح
						</button>
						<button
							onClick={() => setForm((f) => ({ ...f, type: "loan" }))}
							className={`py-1 px-2 rounded text-[11px] cursor-pointer transition-colors ${
								form.type === "loan"
									? "bg-pink-400/20 text-pink-400 font-bold"
									: "bg-white/5 text-[#6b6b8a] hover:bg-white/10"
							}`}
						>
							أخذ سلفة
						</button>
						<button
							onClick={() => setForm((f) => ({ ...f, type: "loan_payment" }))}
							className={`py-1 px-2 rounded text-[11px] cursor-pointer transition-colors ${
								form.type === "loan_payment"
									? "bg-teal-400/20 text-teal-400 font-bold"
									: "bg-white/5 text-[#6b6b8a] hover:bg-white/10"
							}`}
						>
							سداد سلفة
						</button>
					</div>
				</div>

				{/* Profit reference */}
				<div className="bg-[#0d0d14] rounded-lg py-2.5 px-3.5 mb-4 border border-white/5 flex justify-between text-xs items-center">
					<div className="flex flex-col gap-1">
						<span className="text-[#6b6b8a]">الأرباح المتاحة</span>
						<span className="text-green-400 font-bold">
							₪{fmt(stats.netBalance)}
						</span>
					</div>
					<div className="flex flex-col gap-1 text-left">
						<span className="text-[#6b6b8a]">الديون المستحقة</span>
						<span
							className={`font-bold ${
								stats.totalDebt > 0 ? "text-red-400" : "text-[#f0f0f8]"
							}`}
						>
							₪{fmt(stats.totalDebt)}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-3.5">
					{/* Amount + Date */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								المبلغ (₪) *
							</label>
							<input
								className={`${inputStyle} ${
									form.type === "withdrawal" || form.type === "loan"
										? "border-red-400/30"
										: "border-green-400/30"
								}`}
								type="number"
								min="0.01"
								step="0.01"
								dir="ltr"
								value={form.amount}
								onChange={(e) =>
									setForm((f) => ({ ...f, amount: e.target.value }))
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
								value={form.date}
								onChange={(e) =>
									setForm((f) => ({ ...f, date: e.target.value }))
								}
							/>
						</div>
					</div>

					{/* Channel */}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							طريقة الدفع
						</label>
						<div className="flex gap-2">
							{(["cash", "bank"] as const).map((ch) => (
								<button
									key={ch}
									onClick={() =>
										setForm((f) => ({
											...f,
											channel: ch,
											bank_account_id: "",
										}))
									}
									className={`flex-1 py-2 rounded-lg text-[13px] border-[1.5px] cursor-pointer transition-colors ${
										form.channel === ch
											? "border-[#4f6ef7] bg-indigo-500/15 text-indigo-400 font-semibold"
											: "border-[#2a2a3e] bg-[#1a1a26] text-[#6b6b8a]"
									}`}
								>
									{ch === "cash" ? "💵 نقدي" : "🏦 بنك"}
								</button>
							))}
						</div>
					</div>

					{/* Bank account */}
					{form.channel === "bank" && (
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

					{/* Description */}
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظة (اختياري)
						</label>
						<input
							className={inputStyle}
							value={form.description}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
							placeholder={
								form.type === "withdrawal"
									? `سحب أرباح - ${modalPartner.name}`
									: form.type === "loan"
										? `أخذ سلفة - ${modalPartner.name}`
										: form.type === "loan_payment"
											? `سداد سلفة - ${modalPartner.name}`
											: `إيداع أرباح - ${modalPartner.name}`
							}
						/>
					</div>
				</div>

				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 text-white ${
							form.type === "withdrawal" || form.type === "loan"
								? "bg-gradient-to-br from-red-500 to-red-600 border-none"
								: "bg-gradient-to-br from-green-500 to-green-600 border-none"
						} ${
							saving || !form.amount || parseFloat(form.amount) <= 0
								? "opacity-60"
								: "opacity-100"
						}`}
						onClick={onSaveClick}
						disabled={saving || !form.amount || parseFloat(form.amount) <= 0}
					>
						{saving
							? "جاري الحفظ..."
							: form.type === "withdrawal"
								? "تسجيل السحب"
								: form.type === "loan"
									? "أخذ سلفة"
									: form.type === "loan_payment"
										? "سداد السلفة"
										: "تسجيل الإيداع"}
					</button>
				</div>
			</div>
		</div>
	);
}
