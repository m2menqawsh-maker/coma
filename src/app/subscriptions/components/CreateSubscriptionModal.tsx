"use client";

import { useState, useEffect } from "react";
import type { Customer, Product } from "@/app/sessions/types";
import type { SubscriptionType } from "../types";
import { inputStyle, btnPrimary, btnSecondary } from "@/app/sessions/utils";

interface CreateSubscriptionModalProps {
	onSave: (data: any) => Promise<void>;
	customers: Customer[];
	products: Product[];
	pricing: any;
	onCancel: () => void;
}

export default function CreateSubscriptionForm({
	onSave,
	customers,
	products,
	pricing,
	onCancel,
}: CreateSubscriptionModalProps) {
	const [customerId, setCustomerId] = useState("");
	const [name, setName] = useState("");
	const [type, setType] = useState<SubscriptionType>("days");
	const [device, setDevice] = useState<"mobile" | "laptop" | "any">("any");
	const [notes, setNotes] = useState("");
	const [startDate, setStartDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [endDate, setEndDate] = useState("");
	const [price, setPrice] = useState<number>(0);
	const [cost, setCost] = useState<number>(0);
	const [dailyHours, setDailyHours] = useState<number>(0);
	const [bulkHours, setBulkHours] = useState<number>(0);
	const [excludedDays, setExcludedDays] = useState<number[]>([]);

	const [drinksType, setDrinksType] = useState<"daily" | "total">("daily");
	const [drinksCount, setDrinksCount] = useState<number>(0);
	const [drinksSelection, setDrinksSelection] = useState<"all" | "specific">("all");
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [customerSearch, setCustomerSearch] = useState("");
	const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
	const [isNameAuto, setIsNameAuto] = useState(true);
	const [isCostAuto, setIsCostAuto] = useState(true);

	const filteredCustomers = customers.filter(c => 
		c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
		(c.phone && c.phone.includes(customerSearch))
	);

	const selectedCustomer = customers.find(c => c.id === customerId);

	// Auto-calculate expected hours
	const expectedHours = type === "days" ? (dailyHours * (30 - excludedDays.length * 4)) : bulkHours; // Rough estimate 30 days month, 4 weeks

	// Auto-generate name and calculate cost/price
	useEffect(() => {
		let totalHours = 0;
		if (type === "days") {
			// calculate approx total hours: Assume 30 days total duration, subtract excluded days (approx 4 per month)
			// A better approach is to calculate the exact days between start_date and end_date excluding excluded_days.
			if (startDate && endDate) {
				const start = new Date(startDate);
				const end = new Date(endDate);
				let daysCount = 0;
				for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					if (!excludedDays.includes(d.getDay())) daysCount++;
				}
				totalHours = daysCount * dailyHours;
			}
		} else {
			totalHours = bulkHours;
		}

		if (isNameAuto && selectedCustomer) {
			const typeStr = type === "days" ? `${dailyHours}س يومياً` : `${bulkHours}س إجمالي`;
			const devStr = device === "mobile" ? " (جوال)" : (device === "laptop" ? " (لابتوب)" : "");
			setName(`اشتراك ${selectedCustomer.name} - ${typeStr}${devStr}`);
		} else if (isNameAuto && !selectedCustomer) {
			setName("");
		}

		if (isCostAuto && pricing && totalHours > 0) {
			let placeCost = 0;
			
			if (device === "mobile") {
				placeCost = pricing.mobile_place_cost;
			} else if (device === "laptop") {
				placeCost = pricing.laptop_place_cost;
			} else {
				// Average for 'any' device
				placeCost = (pricing.mobile_place_cost + pricing.laptop_place_cost) / 2;
			}

			setCost(Math.round(totalHours * placeCost));
		}
	}, [selectedCustomer, type, dailyHours, bulkHours, device, startDate, endDate, excludedDays, isNameAuto, isCostAuto, pricing]);

	const toggleExcludedDay = (day: number) => {
		setExcludedDays(prev => 
			prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
		);
	};
	
	const toggleProduct = (prodId: string) => {
		setSelectedProducts(prev => 
			prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		
		const data = {
			customer_id: customerId,
			name: name || "اشتراك",
			type,
			device: device === "any" ? null : device,
			start_date: startDate,
			end_date: endDate,
			price,
			cost,
			limit_value: type === "hours" ? bulkHours : dailyHours,
			excluded_days: excludedDays.length > 0 ? excludedDays : null,
			notes: notes ? notes : null,
			drinks_allowance: drinksCount > 0 ? {
				type: drinksType,
				count: drinksCount,
				allowed_products: drinksSelection === "all" ? "all" : selectedProducts
			} : null,
			is_active: true
		};

		await onSave(data);
		setIsSubmitting(false);
	};

	return (
		<div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden shadow-lg mt-6">
			<div className="p-6">
				<form id="create-subscription-form" onSubmit={handleSubmit} className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<div className="relative">
								<label className="block text-sm text-zinc-400 mb-1">الزبون (ابحث بالاسم أو الرقم)</label>
								<div 
									className={`${inputStyle} flex items-center justify-between cursor-pointer`}
									onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
								>
									<span className={selectedCustomer ? "text-white" : "text-zinc-500"}>
										{selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ""}` : "-- اختر زبون --"}
									</span>
									<span className="text-zinc-500 text-xs">▼</span>
								</div>
								
								{showCustomerDropdown && (
									<div className="absolute z-10 w-full mt-1 bg-[#1a1a26] border border-[#2a2a3e] rounded-lg shadow-xl max-h-60 flex flex-col">
										<div className="p-2 border-b border-[#2a2a3e]">
											<input 
												type="text" 
												placeholder="بحث..." 
												value={customerSearch}
												onChange={e => setCustomerSearch(e.target.value)}
												className="w-full bg-[#12121a] border border-[#2a2a3e] rounded py-1.5 px-3 text-sm text-white outline-none focus:border-indigo-500/50"
												autoFocus
											/>
										</div>
										<div className="overflow-y-auto custom-scrollbar p-1">
											{filteredCustomers.length === 0 ? (
												<div className="p-3 text-center text-zinc-500 text-sm">لا يوجد نتائج</div>
											) : (
												filteredCustomers.map((c) => (
													<div 
														key={c.id} 
														onClick={() => {
															setCustomerId(c.id);
															setShowCustomerDropdown(false);
															setCustomerSearch("");
														}}
														className={`p-2.5 rounded cursor-pointer text-sm ${customerId === c.id ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-300 hover:bg-white/5"}`}
													>
														{c.name} {c.phone ? <span className="text-zinc-500 text-xs mr-2">{c.phone}</span> : ""}
													</div>
												))
											)}
										</div>
									</div>
								)}
							</div>
							<div>
								<label className="block text-sm text-zinc-400 mb-1">اسم الاشتراك (توضيحي)</label>
								<input
									type="text"
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setIsNameAuto(false);
									}}
									className={inputStyle}
									placeholder="مثال: اشتراك شهر يونيو"
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm text-zinc-400 mb-1">تاريخ البداية</label>
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className={inputStyle}
									required
								/>
							</div>
							<div>
								<label className="block text-sm text-zinc-400 mb-1">تاريخ النهاية</label>
								<input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className={inputStyle}
									required
								/>
							</div>
						</div>
						
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm text-zinc-400 mb-1">تحديد الجهاز المسموح</label>
								<select
									value={device}
									onChange={(e) => setDevice(e.target.value as "mobile" | "laptop" | "any")}
									className={inputStyle}
								>
									<option value="any">كلاهما (لابتوب أو جوال)</option>
									<option value="mobile">موبايل فقط</option>
									<option value="laptop">لابتوب فقط</option>
								</select>
							</div>
							<div>
								{/* Placeholder for alignment */}
							</div>
						</div>
						
						<div className="grid grid-cols-2 gap-4 bg-indigo-500/5 p-3 border border-indigo-500/20 rounded-lg">
							<div>
								<label className="block text-sm text-indigo-300 mb-1">
									سعر الاشتراك (مبيع) 
								</label>
								<input
									type="number"
									step="0.01"
									value={price}
									onChange={(e) => setPrice(Number(e.target.value))}
									className={inputStyle}
									required
								/>
							</div>
							<div>
								<label className="block text-sm text-zinc-400 mb-1">
									تكلفة الاشتراك (رأس المال)
									{isCostAuto && <span className="text-[10px] bg-white/10 px-1 py-0.5 ml-2 rounded text-zinc-400">تلقائي</span>}
								</label>
								<input
									type="number"
									step="0.01"
									value={cost}
									onChange={(e) => {
										setCost(Number(e.target.value));
										setIsCostAuto(false);
									}}
									className={inputStyle}
									required
								/>
							</div>
						</div>

						<div className="p-4 bg-white/5 rounded-xl border border-white/10">
							<h3 className="text-white font-semibold mb-3">نظام الساعات</h3>
							<div className="flex gap-4 mb-4">
								<label className="flex items-center gap-2 text-zinc-300">
									<input 
										type="radio" 
										checked={type === "days"} 
										onChange={() => setType("days")}
										className="accent-indigo-500"
									/>
									ساعات محددة يومياً
								</label>
								<label className="flex items-center gap-2 text-zinc-300">
									<input 
										type="radio" 
										checked={type === "hours"} 
										onChange={() => setType("hours")}
										className="accent-indigo-500"
									/>
									رصيد ساعات إجمالي
								</label>
							</div>
							
							{type === "days" ? (
								<div className="space-y-4">
									<div>
										<label className="block text-sm text-zinc-400 mb-1">ساعات يومية مسموحة</label>
										<input
											type="number"
											value={dailyHours}
											onChange={(e) => setDailyHours(Number(e.target.value))}
											className={inputStyle}
											min="0"
										/>
									</div>
									<div>
										<label className="block text-sm text-zinc-400 mb-2">الأيام المستثناة</label>
										<div className="flex flex-wrap gap-2">
											{[
												{ id: 0, label: "الأحد" },
												{ id: 1, label: "الاثنين" },
												{ id: 2, label: "الثلاثاء" },
												{ id: 3, label: "الأربعاء" },
												{ id: 4, label: "الخميس" },
												{ id: 5, label: "الجمعة" },
												{ id: 6, label: "السبت" },
											].map(day => (
												<label key={day.id} className={`px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors ${excludedDays.includes(day.id) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
													<input 
														type="checkbox" 
														className="hidden"
														checked={excludedDays.includes(day.id)}
														onChange={() => toggleExcludedDay(day.id)}
													/>
													{day.label}
												</label>
											))}
										</div>
									</div>
								</div>
							) : (
								<div>
									<label className="block text-sm text-zinc-400 mb-1">رصيد الساعات الإجمالي</label>
									<input
										type="number"
										value={bulkHours}
										onChange={(e) => setBulkHours(Number(e.target.value))}
										className={inputStyle}
										min="0"
									/>
								</div>
							)}
						</div>
						
						<div className="p-4 bg-white/5 rounded-xl border border-white/10">
							<h3 className="text-white font-semibold mb-3">نظام المشاريب</h3>
							
							<div className="grid grid-cols-2 gap-4 mb-4">
								<div>
									<label className="block text-sm text-zinc-400 mb-1">طبيعة الرصيد</label>
									<select
										value={drinksType}
										onChange={(e) => setDrinksType(e.target.value as "daily" | "total")}
										className={inputStyle}
									>
										<option value="daily">يومي (مثلاً 2 كل يوم)</option>
										<option value="total">إجمالي (طوال فترة الاشتراك)</option>
									</select>
								</div>
								<div>
									<label className="block text-sm text-zinc-400 mb-1">عدد المشاريب</label>
									<input
										type="number"
										value={drinksCount}
										onChange={(e) => setDrinksCount(Number(e.target.value))}
										className={inputStyle}
										min="0"
									/>
								</div>
							</div>
							
							{drinksCount > 0 && (
								<div className="space-y-4 border-t border-white/10 pt-4 mt-2">
									<div className="flex gap-4">
										<label className="flex items-center gap-2 text-zinc-300">
											<input 
												type="radio" 
												checked={drinksSelection === "all"} 
												onChange={() => setDrinksSelection("all")}
												className="accent-indigo-500"
											/>
											جميع المشاريب مسموحة
										</label>
										<label className="flex items-center gap-2 text-zinc-300">
											<input 
												type="radio" 
												checked={drinksSelection === "specific"} 
												onChange={() => setDrinksSelection("specific")}
												className="accent-indigo-500"
											/>
											تحديد مشاريب معينة
										</label>
									</div>
									
									{drinksSelection === "specific" && (
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded">
											{products.map(p => (
												<label key={p.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
													<input
														type="checkbox"
														checked={selectedProducts.includes(p.id)}
														onChange={() => toggleProduct(p.id)}
														className="accent-indigo-500 rounded"
													/>
													<span className="truncate">{p.name}</span>
												</label>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						<div className="p-4 bg-white/5 rounded-xl border border-white/10">
							<h3 className="text-white font-semibold mb-3">ملاحظات</h3>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className={`${inputStyle} resize-none h-20`}
								placeholder="اكتب أي ملاحظات إضافية حول هذا الاشتراك..."
							/>
						</div>
					</form>
				</div>
				<div className="p-5 border-t border-[#2a2a3e] bg-[#1a1a26]/50 flex justify-end gap-3">
					<button type="button" onClick={onCancel} className={btnSecondary}>
						إلغاء
					</button>
					<button
						form="create-subscription-form"
						type="submit"
						disabled={isSubmitting || !customerId || !startDate || !endDate}
						className={btnPrimary}
					>
						{isSubmitting ? "جاري الحفظ..." : "حفظ الاشتراك"}
					</button>
				</div>
			</div>
	);
}
