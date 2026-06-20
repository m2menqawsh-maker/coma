"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import type { PricingConfig } from "../types";
import { btnPrimary, inputStyle } from "../utils";

const supabase = createClient();

export default function PricingTab() {
	const [pricing, setPricing] = useState<PricingConfig | null>(null);
	const [pricingForm, setPricingForm] = useState({
		mobile_rate: "",
		laptop_rate: "",
		mobile_place_cost: "",
		laptop_place_cost: "",
		dev_percent: "",
	});
	const [savingPricing, setSavingPricing] = useState(false);
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		setLoading(true);
		const { data: price, error } = await supabase
			.from("pricing_config")
			.select("*")
			.order("effective_from", { ascending: false })
			.limit(1);

		if (error) {
			toast.error(`خطأ في تحميل بيانات التسعير: ${error.message}`);
		}

		if (price?.[0]) {
			setPricing(price[0]);
			setPricingForm({
				mobile_rate: String(+price[0].mobile_rate),
				laptop_rate: String(+price[0].laptop_rate),
				mobile_place_cost: String(+price[0].mobile_place_cost),
				laptop_place_cost: String(+price[0].laptop_place_cost),
				dev_percent: String(+price[0].dev_percent),
			});
		}
		setLoading(false);
	};

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleSavePricing = async () => {
		setSavingPricing(true);
		const data = {
			mobile_rate: Math.max(0, parseFloat(pricingForm.mobile_rate) || 0),
			laptop_rate: Math.max(0, parseFloat(pricingForm.laptop_rate) || 0),
			mobile_place_cost: Math.max(
				0,
				parseFloat(pricingForm.mobile_place_cost) || 0,
			),
			laptop_place_cost: Math.max(
				0,
				parseFloat(pricingForm.laptop_place_cost) || 0,
			),
			dev_percent: Math.max(
				0,
				Math.min(100, parseFloat(pricingForm.dev_percent) || 0),
			),
		};

		let error: any;
		if (pricing?.id) {
			const res = await supabase
				.from("pricing_config")
				.update(data)
				.eq("id", pricing.id);
			error = res.error;
		} else {
			const res = await supabase.from("pricing_config").insert({
				...data,
				effective_from: new Date().toISOString().split("T")[0],
			});
			error = res.error;
		}

		setSavingPricing(false);
		if (error) {
			toast.error(`فشل الحفظ: ${error.message}`);
		} else {
			toast.success("تم حفظ التسعير ✓");
			setPricingForm({
				mobile_rate: String(data.mobile_rate),
				laptop_rate: String(data.laptop_rate),
				mobile_place_cost: String(data.mobile_place_cost),
				laptop_place_cost: String(data.laptop_place_cost),
				dev_percent: String(data.dev_percent),
			});
			loadData();
		}
	};

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="bg-[#111118] rounded-[14px] p-6 border border-white/5">
			<h2 className="text-[15px] font-semibold text-[#e0e0f0] mb-5">
				أسعار الجلسات
			</h2>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						سعر الموبايل (₪/ساعة)
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0"
						step="0.5"
						dir="ltr"
						value={pricingForm.mobile_rate}
						onChange={(e) =>
							setPricingForm((f) => ({ ...f, mobile_rate: e.target.value }))
						}
					/>
				</div>
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						سعر اللابتوب (₪/ساعة)
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0"
						step="0.5"
						dir="ltr"
						value={pricingForm.laptop_rate}
						onChange={(e) =>
							setPricingForm((f) => ({ ...f, laptop_rate: e.target.value }))
						}
					/>
				</div>
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						تكلفة مكان موبايل (₪/ساعة)
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0"
						step="0.1"
						dir="ltr"
						value={pricingForm.mobile_place_cost}
						onChange={(e) =>
							setPricingForm((f) => ({
								...f,
								mobile_place_cost: e.target.value,
							}))
						}
					/>
				</div>
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						تكلفة مكان لابتوب (₪/ساعة)
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0"
						step="0.1"
						dir="ltr"
						value={pricingForm.laptop_place_cost}
						onChange={(e) =>
							setPricingForm((f) => ({
								...f,
								laptop_place_cost: e.target.value,
							}))
						}
					/>
				</div>
				<div className="col-span-full">
					<label className="text-xs text-amber-400 block mb-1.5">
						نسبة المطوّر (%)
					</label>
					<input
						className={inputStyle}
						type="number"
						min="0"
						max="100"
						step="1"
						dir="ltr"
						value={pricingForm.dev_percent}
						onChange={(e) =>
							setPricingForm((f) => ({ ...f, dev_percent: e.target.value }))
						}
						placeholder="0"
					/>
				</div>
			</div>
			<button
				className={`${btnPrimary} mt-5 ${savingPricing ? "opacity-60" : "opacity-100"}`}
				onClick={handleSavePricing}
				disabled={savingPricing}
			>
				{savingPricing ? "جاري الحفظ..." : "حفظ التسعير"}
			</button>
		</div>
	);
}
