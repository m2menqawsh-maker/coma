"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import type { Partner } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";
import PartnerModal from "./PartnerModal";

const supabase = createClient();

export default function PartnersTab() {
	const [partners, setPartners] = useState<Partner[]>([]);
	const [loading, setLoading] = useState(true);
	const [newPartner, setNewPartner] = useState({ name: "", share_percent: "" });
	const [savingPartner, setSavingPartner] = useState(false);
	const [editPartner, setEditPartner] = useState<Partner | null>(null);

	const loadData = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("partners")
			.select("*")
			.order("name");
		if (error) {
			toast.error(`خطأ في تحميل الشركاء: ${error.message}`);
		} else {
			setPartners(data || []);
		}
		setLoading(false);
	};

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const handleAddPartner = async () => {
		if (!newPartner.name.trim() || !newPartner.share_percent) return;
		setSavingPartner(true);
		const { error } = await supabase.from("partners").insert({
			name: newPartner.name.trim(),
			share_percent: Math.max(0, parseFloat(newPartner.share_percent) || 0),
		});
		setSavingPartner(false);
		if (error) {
			toast.error(`فشل إضافة الشريك: ${error.message}`);
		} else {
			toast.success("تمت إضافة الشريك ✓");
			setNewPartner({ name: "", share_percent: "" });
			loadData();
		}
	};

	const handleSaveEditPartner = async (
		id: string,
		name: string,
		sharePercent: number,
	) => {
		const { error } = await supabase
			.from("partners")
			.update({
				name: name,
				share_percent: sharePercent,
			})
			.eq("id", id);

		if (error) {
			toast.error(`فشل التعديل: ${error.message}`);
			return false;
		} else {
			toast.success("تم تعديل الشريك ✓");
			loadData();
			return true;
		}
	};

	const handleTogglePartner = async (id: string, current: boolean) => {
		const { error } = await supabase
			.from("partners")
			.update({ is_active: !current })
			.eq("id", id);
		if (error) toast.error(`فشل التحديث: ${error.message}`);
		else loadData();
	};

	const totalPercent = partners
		.filter((p) => p.is_active)
		.reduce((s, p) => s + p.share_percent, 0);

	if (loading)
		return (
			<div className="p-10">
				<LoadingSpinner />
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			{/* Add partner */}
			<div className="bg-[#111118] rounded-[14px] p-5 border border-white/5">
				<h2 className="text-[15px] font-semibold text-[#e0e0f0] mb-4">
					إضافة شريك
				</h2>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">الاسم</label>
						<input
							className={inputStyle}
							value={newPartner.name}
							onChange={(e) =>
								setNewPartner((f) => ({ ...f, name: e.target.value }))
							}
							placeholder="اسم الشريك..."
						/>
					</div>
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							النسبة (%)
						</label>
						<input
							className={inputStyle}
							type="number"
							min="1"
							max="100"
							dir="ltr"
							value={newPartner.share_percent}
							onChange={(e) =>
								setNewPartner((f) => ({ ...f, share_percent: e.target.value }))
							}
							placeholder="0"
						/>
					</div>
				</div>
				<button
					className={`${btnPrimary} mt-3.5 ${savingPartner ? "opacity-60" : "opacity-100"}`}
					onClick={handleAddPartner}
					disabled={savingPartner || !newPartner.name.trim()}
				>
					{savingPartner ? "جاري الإضافة..." : "+ إضافة شريك"}
				</button>
			</div>

			{/* Partners list */}
			<div className="bg-[#111118] rounded-[14px] p-5 border border-white/5">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-[15px] font-semibold text-[#e0e0f0]">الشركاء</h2>
					<span
						className={`text-xs py-1 px-2.5 rounded-full border ${
							totalPercent === 100
								? "bg-green-500/10 text-green-400 border-green-500/20"
								: "bg-red-500/10 text-red-400 border-red-500/20"
						}`}
					>
						المجموع: {totalPercent}%
					</span>
				</div>
				{partners.length === 0 ? (
					<p className="text-[#4a4a6a] text-[13px]">لا يوجد شركاء بعد</p>
				) : (
					<div className="flex flex-col gap-2">
						{partners.map((p) => (
							<div
								key={p.id}
								className={`flex justify-between items-center py-3 px-3.5 rounded-lg border border-white/5 ${
									p.is_active
										? "bg-[#0d0d14] opacity-100"
										: "bg-white/5 opacity-50"
								}`}
							>
								<div>
									<div className="text-sm font-semibold text-[#e0e0f0]">
										{p.name}
									</div>
									<div className="text-xs text-[#6b6b8a] mt-0.5">
										{p.share_percent}%
									</div>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => setEditPartner(p)}
										className={`${btnSecondary} !py-1.5 !px-3 !text-xs !text-indigo-400 !border-indigo-400/20`}
									>
										تعديل
									</button>
									<button
										onClick={() => handleTogglePartner(p.id, p.is_active)}
										className={`${btnSecondary} !py-1.5 !px-3.5 !text-xs ${
											p.is_active
												? "!text-red-400 !border-red-400/20"
												: "!text-green-400 !border-green-400/20"
										}`}
									>
										{p.is_active ? "تعطيل" : "تفعيل"}
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{editPartner && (
				<PartnerModal
					partner={editPartner}
					onSave={handleSaveEditPartner}
					onClose={() => setEditPartner(null)}
				/>
			)}
		</div>
	);
}
