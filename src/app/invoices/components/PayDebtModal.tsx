"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, InvoiceStatus } from "../types";
import { btnPrimary, btnSecondary, fmt, inputStyle } from "../utils";

interface PayDebtModalProps {
	invoice: Invoice;
	customerBalance: number | null;
	bankAccounts: { id: string; name: string }[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

const supabase = createClient();

export default function PayDebtModal({
	invoice,
	customerBalance,
	bankAccounts,
	onClose,
	onSuccess,
	onError,
}: PayDebtModalProps) {
	const [cash, setCash] = useState("");
	const [bank, setBank] = useState("");
	const [bankId, setBankId] = useState("");
	const [saving, setSaving] = useState(false);

	const handlePayDebt = async () => {
		const cashAmt = parseFloat(cash) || 0;
		const bankAmt = parseFloat(bank) || 0;

		if (cashAmt + bankAmt <= 0) {
			onError("أدخل المبلغ");
			return;
		}

		if (bankAmt > 0 && !bankId) {
			onError("اختر الحساب البنكي");
			return;
		}

		setSaving(true);

		const totalPaying = cashAmt + bankAmt;
		const debtBefore = invoice.debt_created;
		const remainingDebt = Math.max(
			0,
			Math.round((debtBefore - totalPaying) * 100) / 100,
		);
		const overpaid = Math.max(
			0,
			Math.round((totalPaying - debtBefore) * 100) / 100,
		);
		const today = new Date().toISOString().split("T")[0];

		const customerCurrentBalance = customerBalance || 0;
		const oldDebtOnBalance = Math.max(0, -customerCurrentBalance);
		const debtClearedFromBalance = Math.min(overpaid, oldDebtOnBalance);
		const isCleared = remainingDebt === 0 && debtClearedFromBalance > 0;
		const newStatus: InvoiceStatus =
			remainingDebt > 0 ? "partial" : isCleared ? "cleared" : "paid";

		const { error: e1 } = await supabase
			.from("invoices")
			.update({
				cash_paid: invoice.cash_paid + cashAmt,
				bank_paid: invoice.bank_paid + bankAmt,
				debt_created: remainingDebt,
				status: newStatus,
			})
			.eq("id", invoice.id);

		if (e1) {
			onError(`فشل التحديث: ${e1.message}`);
			setSaving(false);
			return;
		}

		if (invoice.customer_id) {
			const { data: cust } = await supabase
				.from("customers")
				.select("balance")
				.eq("id", invoice.customer_id)
				.single();

			const currentBalance =
				(cust as { balance?: number } | null)?.balance || 0;
			const newBalance = currentBalance + overpaid;

			await supabase
				.from("customers")
				.update({ balance: newBalance })
				.eq("id", invoice.customer_id);

			await supabase.from("customer_debt_payments").insert({
				customer_id: invoice.customer_id,
				invoice_id: invoice.id,
				amount: totalPaying,
				channel: bankAmt > 0 ? "bank" : "cash",
				bank_account_id: bankAmt > 0 ? bankId : null,
				date: today,
				note:
					remainingDebt > 0
						? `دفعة جزئية ₪${fmt(totalPaying)} — متبقي ₪${fmt(remainingDebt)}`
						: overpaid > 0
							? `سداد كامل + رصيد دائن ₪${fmt(overpaid)}`
							: "سداد كامل",
			});

			// تسجيل في دفتر الأستاذ
			const ledgerEntries = [];
			if (cashAmt > 0) {
				ledgerEntries.push({
					date: today,
					tx_type: "debt_payment",
					direction: "in",
					channel: "cash",
					amount: cashAmt,
					description: `سداد دين: ${invoice.customer_name}`,
					reference_type: "invoice",
					bank_account_id: null,
				});
			}
			if (bankAmt > 0) {
				ledgerEntries.push({
					date: today,
					tx_type: "debt_payment",
					direction: "in",
					channel: "bank",
					amount: bankAmt,
					description: `سداد دين: ${invoice.customer_name}`,
					reference_type: "invoice",
					bank_account_id: bankId || null,
					transfer_status: "pending",
				});
				// تسجيل الحوالة البنكية كـ pending
				await supabase.from("bank_transfers").insert({
					date: today,
					bank_account_id: bankId || null,
					amount: bankAmt,
					direction: "in",
					status: "pending",
					description: `سداد دين: ${invoice.customer_name}`,
					sender_name: invoice.customer_name,
					invoice_id: invoice.id,
					reference_type: "debt_payment",
				});
			}
			if (ledgerEntries.length > 0) {
				await supabase.from("ledger_entries").insert(ledgerEntries);
			}
		}

		setSaving(false);

		const msg =
			remainingDebt > 0
				? `تم تسجيل الدفعة ✓ — متبقي ₪${fmt(remainingDebt)}`
				: overpaid > 0
					? `تم السداد ✓ — رصيد دائن ₪${fmt(overpaid)} أُضيف للزبون`
					: "تم سداد الدين كاملاً ✓";

		onSuccess(msg);
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl w-[400px] max-w-[95%] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
				<div className="py-4 px-5 border-b border-white/5 bg-red-400/5">
					<h3 className="m-0 text-base text-red-400">سداد دين فاتورة</h3>
					<p className="text-xs text-[#6b6b8a] mt-1">
						الزبون:{" "}
						<span className="text-[#e8e8f5]">{invoice.customer_name}</span>
					</p>
				</div>

				<div className="p-5">
					<div className="bg-[#1a1a26] rounded-lg p-3 mb-4 border border-red-400/20">
						<div className="text-xs text-[#9090b0]">الدين الحالي</div>
						<div className="text-2xl font-bold text-red-400">
							₪{fmt(invoice.debt_created)}
						</div>
						{customerBalance !== null && (
							<div className="text-[11px] text-[#6b6b8a] mt-1.5">
								رصيد الزبون العام:{" "}
								<span
									className={
										customerBalance >= 0 ? "text-green-400" : "text-red-400"
									}
								>
									₪{fmt(customerBalance)}
								</span>
							</div>
						)}
					</div>

					<div className="grid grid-cols-2 gap-2.5">
						<div>
							<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
								دفع نقدي
							</label>
							<input
								className={inputStyle}
								type="number"
								min="0"
								step="0.1"
								value={cash}
								onChange={(e) => setCash(e.target.value)}
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
								دفع بنكي
							</label>
							<input
								className={inputStyle}
								type="number"
								min="0"
								step="0.1"
								value={bank}
								onChange={(e) => setBank(e.target.value)}
								placeholder="0.00"
							/>
						</div>
					</div>

					{parseFloat(bank) > 0 && (
						<div className="mt-2.5">
							<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
								الحساب البنكي المودع فيه
							</label>
							<select
								className={inputStyle}
								value={bankId}
								onChange={(e) => setBankId(e.target.value)}
							>
								<option value="">-- اختر الحساب --</option>
								{bankAccounts.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				<div className="py-4 px-5 border-t border-white/5 flex gap-2.5">
					<button
						className={`${btnSecondary} flex-1`}
						onClick={onClose}
						disabled={saving}
					>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 bg-red-400 border-red-400 text-white hover:bg-red-500 ${saving ? "opacity-60" : "opacity-100"}`}
						onClick={handlePayDebt}
						disabled={saving}
					>
						{saving ? "جاري السداد..." : "سداد"}
					</button>
				</div>
			</div>
		</div>
	);
}
