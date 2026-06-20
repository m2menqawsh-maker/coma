"use client";
import { useRef, useState } from "react";
import { useOfflineSync } from "@/components/OfflineSyncProvider";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Session } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

const supabase = createClient();

interface EditSessionModalProps {
	session: Session;
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function EditSessionModal({
	session,
	onClose,
	onSuccess,
	onError,
}: EditSessionModalProps) {
	const [editCustomerSearch, setEditCustomerSearch] = useState(
		session.customer_name,
	);
	const [editSelectedCustomer, setEditSelectedCustomer] =
		useState<Customer | null>(null);
	const [customerResults, setCustomerResults] = useState<Customer[]>([]);
	const [editStartTime, setEditStartTime] = useState(
		new Date(session.start_time).toISOString().slice(0, 16),
	);
	const [editNotes, setEditNotes] = useState(session.notes || "");
	const [savingEdit, setSavingEdit] = useState(false);
	const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { status: syncStatus } = useOfflineSync();

	const handleEditCustomerSearch = (val: string) => {
		setEditCustomerSearch(val);
		setEditSelectedCustomer(null);
		if (searchRef.current) clearTimeout(searchRef.current);
		if (!val.trim()) {
			setCustomerResults([]);
			return;
		}

		searchRef.current = setTimeout(async () => {
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
				return;
			}

			const { data } = await supabase
				.from("customers")
				.select("*")
				.or(`name.ilike.%${val.trim()}%,phone.ilike.%${val.trim()}%`)
				.order("last_visit_at", { ascending: false, nullsFirst: false })
				.limit(6);
			setCustomerResults((data as Customer[]) || []);
		}, 300);
	};

	const handleEditSessionSave = async () => {
		setSavingEdit(true);

		const name = editSelectedCustomer?.name || editCustomerSearch.trim();
		const customerId = editSelectedCustomer?.id || session.customer_id;
		const startIso = new Date(editStartTime).toISOString();

		const { error } = await supabase
			.from("sessions")
			.update({
				customer_name: name,
				customer_id: customerId,
				start_time: startIso,
				notes: editNotes.trim() || null,
			})
			.eq("id", session.id);

		setSavingEdit(false);
		if (error) {
			onError("خطأ في التعديل");
		} else {
			onSuccess("تم تعديل الجلسة بنجاح");
		}
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[420px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					تعديل الجلسة
				</h2>
				<div className="flex flex-col gap-3.5">
					<div className="relative">
						<label className="text-xs text-[#9090b0] block mb-1.5">
							اسم العميل
						</label>
						<input
							className={`${inputStyle} ${editSelectedCustomer ? "border-green-400/40 focus:border-green-400/40" : ""}`}
							value={editCustomerSearch}
							onChange={(e) => handleEditCustomerSearch(e.target.value)}
							placeholder="ابحث لتغيير العميل..."
						/>
						{syncStatus !== "online" && (
							<div className="text-[11px] text-amber-400 mt-2 p-2 bg-amber-400/10 rounded-md border border-amber-400/20">
								⚠ <b>أنت أوفلاين:</b> البحث عن الزبائن يعمل بشكل كامل (من
								الذاكرة المحلية)، أما باقي البيانات فتعتمد على عمليات آخر ساعة
								فقط.
							</div>
						)}
						{customerResults.length > 0 && !editSelectedCustomer && (
							<div className="absolute z-10 bg-[#1a1a26] border border-[#2a2a3e] rounded-lg mt-1 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] w-full">
								{customerResults.map((c) => (
									<div
										key={c.id}
										onClick={() => {
											setEditSelectedCustomer(c);
											setEditCustomerSearch(c.name);
											setCustomerResults([]);
										}}
										className="py-2.5 px-3.5 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors"
									>
										<div className="text-[13px] text-[#e0e0f0]">{c.name}</div>
									</div>
								))}
							</div>
						)}
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							وقت البداية
						</label>
						<input
							className={inputStyle}
							type="datetime-local"
							value={editStartTime}
							onChange={(e) => setEditStartTime(e.target.value)}
							dir="ltr"
						/>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظات
						</label>
						<input
							className={inputStyle}
							value={editNotes}
							onChange={(e) => setEditNotes(e.target.value)}
							placeholder="..."
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingEdit ? "opacity-60" : "opacity-100"}`}
						onClick={handleEditSessionSave}
						disabled={savingEdit}
					>
						{savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
					</button>
				</div>
			</div>
		</div>
	);
}
