"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import type { BankAccount } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

const supabase = createClient();

export default function BanksTab() {
	const [banks, setBanks] = useState<BankAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [newBank, setNewBank] = useState({
		name: "",
		account_type: "other",
		phone: "",
	});
	const [savingBank, setSavingBank] = useState(false);

	const loadData = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("bank_accounts")
			.select("*")
			.order("name");
		if (error) {
			toast.error(`خطأ في تحميل الحسابات البنكية: ${error.message}`);
		} else {
			setBanks(data || []);
		}
		setLoading(false);
	};

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleAddBank = async () => {
		if (!newBank.name.trim()) return;
		setSavingBank(true);
		const { error } = await supabase.from("bank_accounts").insert({
			name: newBank.name.trim(),
			account_type: newBank.account_type,
			phone: newBank.phone.trim() || null,
		});
		setSavingBank(false);
		if (error) {
			toast.error(`فشل إضافة الحساب: ${error.message}`);
		} else {
			toast.success("تمت إضافة الحساب ✓");
			setNewBank({ name: "", account_type: "other", phone: "" });
			loadData();
		}
	};

	const handleToggleBank = async (id: string, current: boolean) => {
		const { error } = await supabase
			.from("bank_accounts")
			.update({ is_active: !current })
			.eq("id", id);
		if (error) toast.error(`فشل التحديث: ${error.message}`);
		else loadData();
	};

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-[#111118] rounded-[14px] p-5 border border-white/5">
				<h2 className="text-[15px] font-semibold text-[#e0e0f0] mb-4">
					إضافة حساب بنكي
				</h2>
				<div className="flex flex-col gap-3">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">الاسم</label>
						<input
							className={inputStyle}
							value={newBank.name}
							onChange={(e) =>
								setNewBank((f) => ({ ...f, name: e.target.value }))
							}
							placeholder="مثال: PalPay خالد..."
						/>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">النوع</label>
						<select
							className={inputStyle}
							value={newBank.account_type}
							onChange={(e) =>
								setNewBank((f) => ({ ...f, account_type: e.target.value }))
							}
						>
							<option value="palpay">PalPay</option>
							<option value="jawwalpay">JawwalPay</option>
							<option value="bop">Bank of Palestine</option>
							<option value="isbk">ISBK</option>
							<option value="other">أخرى</option>
						</select>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							رقم الهاتف (اختياري)
						</label>
						<input
							className={inputStyle}
							value={newBank.phone}
							onChange={(e) =>
								setNewBank((f) => ({ ...f, phone: e.target.value }))
							}
							placeholder="05xxxxxxxx"
							dir="ltr"
						/>
					</div>
				</div>
				<button
					className={`${btnPrimary} mt-3.5 ${savingBank ? "opacity-60" : "opacity-100"}`}
					onClick={handleAddBank}
					disabled={savingBank || !newBank.name.trim()}
				>
					{savingBank ? "جاري الإضافة..." : "+ إضافة حساب"}
				</button>
			</div>

			<div className="bg-[#111118] rounded-[14px] p-5 border border-white/5">
				<h2 className="text-[15px] font-semibold text-[#e0e0f0] mb-4">
					الحسابات
				</h2>
				{banks.length === 0 ? (
					<p className="text-[#4a4a6a] text-[13px]">لا يوجد حسابات بعد</p>
				) : (
					<div className="flex flex-col gap-2">
						{banks.map((b) => (
							<div
								key={b.id}
								className={`flex justify-between items-center py-3 px-3.5 rounded-lg border border-white/5 ${
									b.is_active
										? "bg-[#0d0d14] opacity-100"
										: "bg-white/5 opacity-50"
								}`}
							>
								<div>
									<div className="text-sm font-semibold text-[#e0e0f0]">
										{b.name}
									</div>
									<div className="text-xs text-[#6b6b8a] mt-0.5">
										{b.account_type}
										{b.phone ? ` · ${b.phone}` : ""}
									</div>
								</div>
								<button
									onClick={() => handleToggleBank(b.id, b.is_active)}
									className={`${btnSecondary} !py-1.5 !px-3.5 !text-xs ${
										b.is_active
											? "!text-red-400 !border-red-400/20"
											: "!text-green-400 !border-green-400/20"
									}`}
								>
									{b.is_active ? "تعطيل" : "تفعيل"}
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
