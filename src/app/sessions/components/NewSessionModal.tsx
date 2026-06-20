"use client";
import { useRef, useState } from "react";
import { useOfflineSync } from "@/components/OfflineSyncProvider";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Device } from "../types";
import { btnPrimary, fmt, inputStyle } from "../utils";

interface NewSessionModalProps {
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function NewSessionModal({
	onClose,
	onSuccess,
	onError,
}: NewSessionModalProps) {
	const [customerSearch, setCustomerSearch] = useState("");
	const [customerResults, setCustomerResults] = useState<Customer[]>([]);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
		null,
	);
	const [searchLoading, setSearchLoading] = useState(false);
	const [newDevice, setNewDevice] = useState<Device>("mobile");
	const [newNotes, setNewNotes] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [isNewCustomer, setIsNewCustomer] = useState(false);
	const [savingSession, setSavingSession] = useState(false);
	const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { status: syncStatus } = useOfflineSync();

	const handleCustomerSearch = (val: string) => {
		setCustomerSearch(val);
		setSelectedCustomer(null);
		if (searchRef.current) clearTimeout(searchRef.current);
		if (!val.trim()) {
			setCustomerResults([]);
			return;
		}

		searchRef.current = setTimeout(async () => {
			setSearchLoading(true);

			if (syncStatus !== "online" || !navigator.onLine) {
				const cachedStr = localStorage.getItem("all_customers_cache");
				if (cachedStr) {
					try {
						const all: Customer[] = JSON.parse(cachedStr);
						const lowerVal = val.trim().toLowerCase();
						const filtered = all.filter(
							(c) =>
								c.name.toLowerCase().includes(lowerVal) ||
								c.phone?.includes(lowerVal),
						);
						filtered.sort(
							(a, b) =>
								new Date(b.last_visit_at || 0).getTime() -
								new Date(a.last_visit_at || 0).getTime(),
						);
						setCustomerResults(filtered.slice(0, 6));
					} catch {}
				}
				setSearchLoading(false);
				return;
			}

			const supabase = createClient();
			const { data } = await supabase
				.from("customers")
				.select("*")
				.or(`name.ilike.%${val.trim()}%,phone.ilike.%${val.trim()}%`)
				.order("last_visit_at", { ascending: false, nullsFirst: false })
				.limit(6);
			setCustomerResults((data as Customer[]) || []);
			setSearchLoading(false);
		}, 300);
	};

	const selectCustomer = async (c: Customer) => {
		setSelectedCustomer(c);
		setCustomerSearch(c.name);
		setCustomerResults([]);
		setIsNewCustomer(false);
		setNewPhone("");
	};

	const handleOpenSession = async () => {
		const name = selectedCustomer?.name || customerSearch.trim();
		if (!name) return;
		setSavingSession(true);

		const supabase = createClient();
		let customerId = selectedCustomer?.id || null;

		if (!selectedCustomer && customerSearch.trim()) {
			if (!newPhone.trim()) {
				onError("رقم الهاتف مطلوب للزبون الجديد");
				setSavingSession(false);
				return;
			}
			const newCustId = crypto.randomUUID();
			const newCustObj = { id: newCustId, name: customerSearch.trim(), phone: newPhone.trim(), balance: 0, is_vip: false, last_visit_at: new Date().toISOString() };
			
			// Optimistically update offline cache
			try {
				const cacheStr = localStorage.getItem("all_customers_cache");
				if (cacheStr) {
					const allCusts = JSON.parse(cacheStr);
					allCusts.unshift(newCustObj);
					localStorage.setItem("all_customers_cache", JSON.stringify(allCusts));
				}
			} catch(e) {}

			try {
				const { data: newCustomer, error: custError } = await supabase
					.from("customers")
					.insert(newCustObj)
					.select()
					.single();
			} catch(err) {
				// Ignore parsing errors from offline mock response
			}
			customerId = newCustId;
		}

		const sessionId = crypto.randomUUID();
		const { error } = await supabase.from("sessions").insert({
			id: sessionId,
			customer_name: name,
			customer_id: customerId,
			device: newDevice,
			notes: newNotes.trim() || null,
			start_time: new Date().toISOString(),
		});

		if (customerId && !error) {
			await supabase
				.from("customers")
				.update({ last_visit_at: new Date().toISOString() })
				.eq("id", customerId);
		}

		setSavingSession(false);
		if (error) {
			onError("خطأ في إنشاء الجلسة");
		} else {
			onSuccess("تم فتح الجلسة بنجاح");
		}
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[420px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">جلسة جديدة</h2>
				<div className="flex flex-col gap-3.5">
					<div className="relative">
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم العميل
						</label>
						<input
							className={`${inputStyle} ${selectedCustomer ? "border-green-400/40 focus:border-green-400/40" : ""}`}
							value={customerSearch}
							onChange={(e) => handleCustomerSearch(e.target.value)}
							placeholder="ابحث بالاسم أو الرقم..."
						/>
						{searchLoading && (
							<div className="text-[11px] text-[#6b6b8a] mt-1">
								جاري البحث...
							</div>
						)}

						{syncStatus !== "online" && (
							<div className="text-[11px] text-amber-400 mt-2 p-2 bg-amber-400/10 rounded-md border border-amber-400/20">
								⚠ <b>أنت أوفلاين:</b> البحث عن الزبائن يعمل بشكل كامل (من
								الذاكرة المحلية)، أما باقي البيانات فتعتمد على عمليات آخر ساعة
								فقط.
							</div>
						)}
						{customerResults.length > 0 && !selectedCustomer && (
							<div className="absolute top-full left-0 right-0 z-10 bg-[#1a1a26] border border-[#2a2a3e] rounded-lg mt-1 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
								{customerResults.map((c) => (
									<div
										key={c.id}
										onClick={() => selectCustomer(c)}
										className="py-2.5 px-3.5 cursor-pointer border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors"
									>
										<div>
											<div className="text-[13px] text-[#e0e0f0] font-medium">
												{c.is_vip && (
													<span className="text-amber-400 ml-1.5">⭐</span>
												)}
												{c.name}
											</div>
											{c.phone && (
												<div className="text-[11px] text-[#6b6b8a]">
													{c.phone}
												</div>
											)}
										</div>
										<div className="text-left text-[11px]">
											{c.balance > 0 && (
												<div className="text-green-400">
													رصيد ₪{fmt(c.balance)}
												</div>
											)}
											{c.balance < 0 && (
												<div className="text-red-400">
													دين ₪{fmt(Math.abs(c.balance))}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
						{isNewCustomer && !selectedCustomer && (
							<div className="mt-2">
								<div className="text-[11px] text-amber-400 mb-2">
									✦ زبون جديد — رقم الهاتف مطلوب
								</div>
								<input
									className={`${inputStyle} ${newPhone.trim() ? "border-green-400/40 focus:border-green-400/40" : "border-red-400/50 focus:border-red-400/50"}`}
									value={newPhone}
									onChange={(e) => setNewPhone(e.target.value)}
									placeholder="رقم الهاتف *"
									dir="ltr"
								/>
								{!newPhone.trim() && (
									<div className="text-[10px] text-red-400 mt-1">
										⚠ رقم الهاتف إلزامي للزبون الجديد
									</div>
								)}
							</div>
						)}
						{!selectedCustomer &&
							!isNewCustomer &&
							customerSearch.trim().length > 1 && (
								<div className="mt-1.5">
									<button
										onClick={() => {
											setIsNewCustomer(true);
											setCustomerResults([]);
										}}
										className="w-full py-2.5 px-3 bg-amber-400/5 border border-dashed border-amber-400/30 rounded-lg text-amber-400 text-xs cursor-pointer text-right hover:bg-amber-400/10 transition-colors"
									>
										✦ ليس من القائمة — تسجيل زبون جديد بهذا الاسم
									</button>
								</div>
							)}
					</div>

					{selectedCustomer && (
						<div className="bg-[#0d0d14] rounded-lg p-3 border border-green-400/15">
							<div className="flex justify-between items-center">
								<div>
									<div className="text-[13px] font-semibold text-[#e0e0f0]">
										{selectedCustomer.is_vip && "⭐ "}
										{selectedCustomer.name}
									</div>
									{selectedCustomer.phone && (
										<div className="text-[11px] text-[#6b6b8a] mt-0.5">
											{selectedCustomer.phone}
										</div>
									)}
								</div>
								<button
									onClick={() => {
										setSelectedCustomer(null);
										setCustomerSearch("");
									}}
									className="bg-transparent border-none text-[#6b6b8a] cursor-pointer text-sm hover:text-[#9090b0] transition-colors p-0"
								>
									✕
								</button>
							</div>
							<div className="flex gap-4 mt-2">
								{selectedCustomer.balance > 0 && (
									<div>
										<div className="text-[10px] text-[#6b6b8a]">رصيد دائن</div>
										<div className="text-[13px] font-bold text-green-400">
											₪{fmt(selectedCustomer.balance)}
										</div>
									</div>
								)}
								{selectedCustomer.balance < 0 && (
									<div>
										<div className="text-[10px] text-[#6b6b8a]">دين سابق</div>
										<div className="text-[13px] font-bold text-red-400">
											₪{fmt(Math.abs(selectedCustomer.balance))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							الجهاز
						</label>
						<div className="flex gap-2">
							{(["mobile", "laptop"] as Device[]).map((d) => (
								<button
									key={d}
									onClick={() => setNewDevice(d)}
									className={`flex-1 py-2.5 rounded-lg text-sm border-[1.5px] cursor-pointer transition-colors ${
										newDevice === d
											? "border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold"
											: "border-[#2a2a3e] bg-[#1a1a26] text-[#6b6b8a] font-normal hover:bg-[#20202e]"
									}`}
								>
									{d === "mobile" ? "📱 موبايل" : "💻 لابتوب"}
								</button>
							))}
						</div>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظات (اختياري)
						</label>
						<input
							className={inputStyle}
							value={newNotes}
							onChange={(e) => setNewNotes(e.target.value)}
							placeholder="..."
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-6">
					<button
						className="bg-white/5 border border-white/10 rounded-lg text-[#9090b0] py-2.5 px-5 text-[13px] cursor-pointer hover:bg-white/10 transition-colors"
						onClick={onClose}
					>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingSession || (!selectedCustomer && !customerSearch.trim()) ? "opacity-60 cursor-not-allowed" : "opacity-100 hover:opacity-90"}`}
						onClick={handleOpenSession}
						disabled={
							savingSession || (!selectedCustomer && !customerSearch.trim())
						}
					>
						{savingSession ? "جاري الفتح..." : "فتح الجلسة"}
					</button>
				</div>
			</div>
		</div>
	);
}
