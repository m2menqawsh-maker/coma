"use client";

import { useState } from "react";
import type { Partner } from "../types";
import { btnPrimary, btnSecondary, inputStyle } from "../utils";

interface PartnerModalProps {
	partner: Partner;
	onSave: (id: string, name: string, sharePercent: number) => Promise<boolean>;
	onClose: () => void;
}

export default function PartnerModal({
	partner,
	onSave,
	onClose,
}: PartnerModalProps) {
	const [form, setForm] = useState({
		name: partner.name,
		share_percent: String(partner.share_percent),
	});
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		const success = await onSave(
			partner.id,
			form.name.trim(),
			Math.max(0, parseFloat(form.share_percent) || 0),
		);
		setSaving(false);
		if (success) onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[380px] border border-white/5">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
					تعديل الشريك
				</h2>
				<div className="flex flex-col gap-3.5">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">الاسم</label>
						<input
							className={inputStyle}
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
							value={form.share_percent}
							onChange={(e) =>
								setForm((f) => ({ ...f, share_percent: e.target.value }))
							}
						/>
					</div>
				</div>
				<div className="flex gap-2.5 mt-5">
					<button className={btnSecondary} onClick={onClose} disabled={saving}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${saving ? "opacity-60" : "opacity-100"}`}
						onClick={handleSave}
						disabled={saving || !form.name.trim()}
					>
						{saving ? "جاري الحفظ..." : "حفظ التعديلات"}
					</button>
				</div>
			</div>
		</div>
	);
}
