"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { recordPurchase } from "../actions/inventory";
import type { InventoryItem } from "../types";
import { btnPrimary, fmt, inputStyle } from "../utils";

const supabase = createClient();

export default function PurchaseTab() {
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [bankAccounts, setBankAccounts] = useState<
		{ id: string; name: string }[]
	>([]);
	const [loading, setLoading] = useState(true);

	const [purchaseItemId, setPurchaseItemId] = useState("");
	const [purchaseQty, setPurchaseQty] = useState("");
	const [purchaseCashAmount, setPurchaseCashAmount] = useState("");
	const [purchaseBankAmount, setPurchaseBankAmount] = useState("");
	const [purchaseBankAccountId, setPurchaseBankAccountId] = useState("");
	const [purchaseNotes, setPurchaseNotes] = useState("");
	const [savingPurchase, setSavingPurchase] = useState(false);

	const loadData = useCallback(async () => {
		setLoading(true);
		const [{ data: invItems }, { data: banks }] = await Promise.all([
			supabase
				.from("inventory_items")
				.select("*")
				.eq("is_active", true)
				.order("name"),
			supabase
				.from("bank_accounts")
				.select("id, name")
				.eq("is_active", true)
				.order("name"),
		]);

		setItems((invItems as InventoryItem[]) || []);
		setBankAccounts((banks as { id: string; name: string }[]) || []);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, []);

	const handlePurchase = async () => {
		const cash = Math.max(0, parseFloat(purchaseCashAmount) || 0);
		const bank = Math.max(0, parseFloat(purchaseBankAmount) || 0);
		if (!purchaseItemId || !purchaseQty) return;
		const qty = Math.max(0, parseFloat(purchaseQty) || 0);
		if (qty <= 0) return;
		if (bank > 0 && !purchaseBankAccountId) {
			toast.error("اختر الحساب البنكي");
			return;
		}

		setSavingPurchase(true);
		const item = items.find((i) => i.id === purchaseItemId);
		if (!item) {
			setSavingPurchase(false);
			return;
		}

		try {
			await recordPurchase({
				itemId: purchaseItemId,
				qty,
				cashAmount: cash,
				bankAmount: bank,
				bankAccountId: purchaseBankAccountId || null,
				notes: purchaseNotes.trim(),
				itemName: item.name,
				currentQty: item.qty,
			});
			toast.success("تم تسجيل الشراء وتسجيله في دفتر الأستاذ ✓");
			setPurchaseItemId("");
			setPurchaseQty("");
			setPurchaseCashAmount("");
			setPurchaseBankAmount("");
			setPurchaseBankAccountId("");
			setPurchaseNotes("");
			loadData();
		} catch (error: any) {
			toast.error(`فشل تسجيل الشراء: ${error.message}`);
		} finally {
			setSavingPurchase(false);
		}
	};

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="bg-[#111118] rounded-xl p-6 border border-white/5">
			<h2 className="text-[15px] font-semibold text-[#e0e0f0] mb-5">
				تسجيل شراء / إضافة للمخزون
			</h2>
			<div className="flex flex-col gap-3.5">
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">الصنف</label>
					<select
						className={inputStyle}
						value={purchaseItemId}
						onChange={(e) => setPurchaseItemId(e.target.value)}
					>
						<option value="">-- اختر صنف --</option>
						{items.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name} (رصيد: {fmt(item.qty)} {item.unit || ""})
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						الكمية المضافة
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0.001"
						step="0.001"
						dir="ltr"
						value={purchaseQty}
						onChange={(e) => setPurchaseQty(e.target.value)}
						placeholder="0"
					/>
				</div>

				{/* المبالغ */}
				<div className="bg-[#0d0d14] rounded-lg p-4 border border-white/5">
					<div className="text-xs text-[#6b6b8a] mb-3">
						تكلفة الشراء (اتركها 0 إذا مجانية)
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-amber-400 block mb-1.5">
								نقدي (₪)
							</label>
							<input
								className={`${inputStyle} ${(parseFloat(purchaseCashAmount) || 0) > 0 ? "!border-amber-400/40" : ""}`}
								type="number"
								min="0"
								step="0.01"
								dir="ltr"
								value={purchaseCashAmount}
								onChange={(e) => setPurchaseCashAmount(e.target.value)}
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="text-xs text-blue-400 block mb-1.5">
								بنك (₪)
							</label>
							<input
								className={`${inputStyle} ${(parseFloat(purchaseBankAmount) || 0) > 0 ? "!border-blue-400/40" : ""}`}
								type="number"
								min="0"
								step="0.01"
								dir="ltr"
								value={purchaseBankAmount}
								onChange={(e) => setPurchaseBankAmount(e.target.value)}
								placeholder="0.00"
							/>
						</div>
					</div>
					{(parseFloat(purchaseCashAmount) || 0) +
						(parseFloat(purchaseBankAmount) || 0) >
						0 && (
						<div className="mt-2.5 py-2 px-3 bg-white/5 rounded-lg flex justify-between">
							<span className="text-xs text-[#6b6b8a]">إجمالي التكلفة</span>
							<span className="text-sm font-bold text-red-400">
								-₪
								{(
									(parseFloat(purchaseCashAmount) || 0) +
									(parseFloat(purchaseBankAmount) || 0)
								).toFixed(2)}
							</span>
						</div>
					)}
				</div>

				{/* الحساب البنكي */}
				{(parseFloat(purchaseBankAmount) || 0) > 0 && (
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							الحساب البنكي
						</label>
						<select
							className={inputStyle}
							value={purchaseBankAccountId}
							onChange={(e) => setPurchaseBankAccountId(e.target.value)}
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
					<label className="text-xs text-[#9090b0] block mb-1.5">ملاحظات</label>
					<input
						className={inputStyle}
						value={purchaseNotes}
						onChange={(e) => setPurchaseNotes(e.target.value)}
						placeholder="مثال: شراء من المورد..."
					/>
				</div>

				{/* Preview */}
				{purchaseItemId &&
					purchaseQty &&
					parseFloat(purchaseQty) > 0 &&
					(() => {
						const item = items.find((i) => i.id === purchaseItemId);
						if (!item) return null;
						const newQty = item.qty + (parseFloat(purchaseQty) || 0);
						const totalCost =
							(parseFloat(purchaseCashAmount) || 0) +
							(parseFloat(purchaseBankAmount) || 0);
						return (
							<div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg py-3 px-4 flex flex-col gap-2">
								<div className="flex justify-between">
									<span className="text-[13px] text-[#9090b0]">
										الرصيد بعد الإضافة
									</span>
									<span className="text-[15px] font-bold text-indigo-400">
										{fmt(item.qty)} → {fmt(newQty)} {item.unit || ""}
									</span>
								</div>
								{totalCost > 0 && (
									<div className="flex justify-between">
										<span className="text-xs text-[#6b6b8a]">
											يُسجَّل في دفتر الأستاذ
										</span>
										<span className="text-[13px] font-semibold text-green-400">
											✓ تلقائياً
										</span>
									</div>
								)}
							</div>
						);
					})()}

				<button
					className={`${btnPrimary} mt-1 ${savingPurchase ? "opacity-60" : ""}`}
					onClick={handlePurchase}
					disabled={
						savingPurchase ||
						!purchaseItemId ||
						!purchaseQty ||
						parseFloat(purchaseQty) <= 0
					}
				>
					{savingPurchase ? "جاري التسجيل..." : "تسجيل الشراء"}
				</button>
			</div>
		</div>
	);
}
