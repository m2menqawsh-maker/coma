"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, InvoiceStatus } from "../types";
import { btnPrimary, btnSecondary, fmt, inputStyle } from "../utils";

interface CrossPaymentModalProps {
	targetInvoice: Invoice;
	bankAccounts: { id: string; name: string }[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

const supabase = createClient();

export default function CrossPaymentModal({
	targetInvoice,
	bankAccounts,
	onClose,
	onSuccess,
	onError,
}: CrossPaymentModalProps) {
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState<
		{ id: string; name: string; phone: string | null; balance: number }[]
	>([]);
	const [payer, setPayer] = useState<{
		id: string;
		name: string;
		balance: number;
	} | null>(null);
	const [searchLoading, setSearchLoading] = useState(false);

	const [cash, setCash] = useState("");
	const [bank, setBank] = useState("");
	const [bankId, setBankId] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSearch = async (val: string) => {
		setSearch(val);
		setPayer(null);
		if (val.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		setSearchLoading(true);
		const { data } = await supabase
			.from("customers")
			.select("id, name, phone, balance")
			.ilike("name", `%${val.trim()}%`)
			.limit(6);
		setSearchResults(
			(data || []) as {
				id: string;
				name: string;
				phone: string | null;
				balance: number;
			}[],
		);
		setSearchLoading(false);
	};

	const handlePayment = async () => {
		if (!payer) return;

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
		const remainingDebt = Math.max(
			0,
			Math.round((targetInvoice.debt_created - totalPaying) * 100) / 100,
		);
		const overpaid = Math.max(
			0,
			Math.round((totalPaying - targetInvoice.debt_created) * 100) / 100,
		);
		const today = new Date().toISOString().split("T")[0];

		// 1. تحديث الفاتورة
		const newStatus: InvoiceStatus = remainingDebt > 0 ? "partial" : "paid";
		await supabase
			.from("invoices")
			.update({
				cash_paid: targetInvoice.cash_paid + cashAmt,
				bank_paid: targetInvoice.bank_paid + bankAmt,
				debt_created: remainingDebt,
				status: newStatus,
			})
			.eq("id", targetInvoice.id);

		// 2. تحديث رصيد صاحب الدين (المستفيد)
		if (targetInvoice.customer_id) {
			const { data: tgt } = await supabase
				.from("customers")
				.select("balance")
				.eq("id", targetInvoice.customer_id)
				.single();
			const tgtBalance = (tgt as { balance: number })?.balance || 0;
			await supabase
				.from("customers")
				.update({ balance: tgtBalance + totalPaying })
				.eq("id", targetInvoice.customer_id);
		}

		// 3. تحديث رصيد الزبون الدافع
		await supabase
			.from("customers")
			.update({ balance: payer.balance - totalPaying })
			.eq("id", payer.id);

		// 4. تسجيل الدفعة للمستفيد
		await supabase.from("customer_debt_payments").insert({
			customer_id: targetInvoice.customer_id || null,
			invoice_id: targetInvoice.id,
			amount: totalPaying,
			channel: bankAmt > 0 ? "bank" : "cash",
			bank_account_id: bankAmt > 0 ? bankId : null,
			date: today,
			note: `سداد من ${payer.name} عن ${targetInvoice.customer_name}${overpaid > 0 ? ` — زيادة ₪${fmt(overpaid)}` : ""}`,
		});

		// 4.1 تسجيل الدفعة على الدافع لتوثيق سحب الرصيد منه
		await supabase.from("customer_debt_payments").insert({
			customer_id: payer.id,
			invoice_id: targetInvoice.id,
			amount: -totalPaying,
			channel: bankAmt > 0 ? "bank" : "cash",
			bank_account_id: bankAmt > 0 ? bankId : null,
			date: today,
			note: `سداد عن فاتورة ${targetInvoice.customer_name}`,
		});

		// 5. تسجيل دفتر الأستاذ
		const entries = [];
		if (cashAmt > 0) {
			entries.push({
				date: today,
				tx_type: "debt_payment",
				direction: "in",
				channel: "cash",
				amount: cashAmt,
				description: `${payer.name} يسدد عن ${targetInvoice.customer_name}`,
				reference_type: "invoice",
				reference_id: targetInvoice.id,
			});
		}
		if (bankAmt > 0) {
			entries.push({
				date: today,
				tx_type: "debt_payment",
				direction: "in",
				channel: "bank",
				amount: bankAmt,
				bank_account_id: bankId,
				description: `${payer.name} يسدد عن ${targetInvoice.customer_name}`,
				reference_type: "invoice",
				reference_id: targetInvoice.id,
				transfer_status: "pending",
			});
			// تسجيل الحوالة البنكية كـ pending
			await supabase.from("bank_transfers").insert({
				date: today,
				bank_account_id: bankId || null,
				amount: bankAmt,
				direction: "in",
				status: "pending",
				description: `سداد من ${payer.name} عن ${targetInvoice.customer_name}`,
				sender_name: payer.name,
				invoice_id: targetInvoice.id,
				reference_type: "debt_payment",
			});
		}
		if (entries.length > 0) {
			await supabase.from("ledger_entries").insert(entries);
		}

		setSaving(false);
		const msg =
			remainingDebt > 0
				? `تم تسجيل دفعة ₪${fmt(totalPaying)} من ${payer.name} — متبقي ₪${fmt(remainingDebt)} ✓`
				: `تم سداد دين ${targetInvoice.customer_name} بالكامل من قِبَل ${payer.name} ✓`;

		onSuccess(msg);
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl w-[450px] max-w-[95%] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
				<div className="py-4 px-5 border-b border-white/5 bg-indigo-400/5">
					<h3 className="m-0 text-base text-indigo-400">
						دفع فاتورة عن زبون آخر
					</h3>
					<p className="text-xs text-[#6b6b8a] mt-1">
						صاحب الفاتورة:{" "}
						<span className="text-[#e8e8f5]">
							{targetInvoice.customer_name}
						</span>{" "}
						| الدين: ₪{fmt(targetInvoice.debt_created)}
					</p>
				</div>

				<div className="p-5">
					{!payer ? (
						<div>
							<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
								ابحث عن الزبون الدافع
							</label>
							<input
								className={inputStyle}
								value={search}
								onChange={(e) => handleSearch(e.target.value)}
								placeholder="اسم الزبون الذي سيدفع..."
							/>
							{searchLoading && (
								<div className="text-xs text-[#6b6b8a] mt-2">جاري البحث...</div>
							)}
							{searchResults.length > 0 && (
								<div className="mt-2 flex flex-col gap-1.5">
									{searchResults.map((c) => (
										<button
											key={c.id}
											onClick={() => setPayer(c)}
											className="bg-white/5 border border-white/5 rounded-lg p-2.5 text-right cursor-pointer flex justify-between hover:bg-white/10 transition-colors"
										>
											<div>
												<div className="text-[#e8e8f5] text-[13px] font-semibold">
													{c.name}
												</div>
												{c.phone && (
													<div className="text-[#6b6b8a] text-[11px]">
														{c.phone}
													</div>
												)}
											</div>
											<div
												className={`text-xs font-semibold ${c.balance >= 0 ? "text-green-400" : "text-red-400"}`}
											>
												{c.balance >= 0 ? "له" : "عليه"} ₪
												{fmt(Math.abs(c.balance))}
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					) : (
						<div>
							<div className="flex justify-between items-center bg-indigo-400/10 py-2.5 px-3.5 rounded-lg mb-4 border border-indigo-400/20">
								<div>
									<div className="text-[11px] text-indigo-400">
										الزبون الدافع
									</div>
									<div className="text-sm font-bold text-[#e8e8f5]">
										{payer.name}
									</div>
									<div
										className={`text-[11px] mt-0.5 ${payer.balance >= 0 ? "text-green-400" : "text-red-400"}`}
									>
										الرصيد الحالي: {payer.balance >= 0 ? "له" : "عليه"} ₪
										{fmt(Math.abs(payer.balance))}
									</div>
								</div>
								<button
									onClick={() => setPayer(null)}
									className="bg-transparent border border-white/10 text-[#9090b0] rounded-md py-1 px-2 text-[11px] cursor-pointer hover:bg-white/5 transition-colors"
								>
									تغيير
								</button>
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
										الحساب البنكي
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
						className={`${btnPrimary} flex-1 bg-indigo-400 border-indigo-400 text-white hover:bg-indigo-500 ${!payer || saving ? "opacity-60" : "opacity-100"}`}
						onClick={handlePayment}
						disabled={!payer || saving}
					>
						{saving ? "جاري التنفيذ..." : "تنفيذ وتسجيل"}
					</button>
				</div>
			</div>
		</div>
	);
}
