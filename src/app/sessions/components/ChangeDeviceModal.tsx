"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "../types";
import { btnPrimary, btnSecondary } from "../utils";

const supabase = createClient();

interface ChangeDeviceModalProps {
	session: Session;
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function ChangeDeviceModal({
	session,
	onClose,
	onSuccess,
	onError,
}: ChangeDeviceModalProps) {
	const [savingDeviceChange, setSavingDeviceChange] = useState(false);

	const handleChangeDeviceSave = async () => {
		setSavingDeviceChange(true);

		const oldDev = session.device;
		const newDev = oldDev === "mobile" ? "laptop" : "mobile";

		const { error } = await supabase
			.from("sessions")
			.update({ device: newDev })
			.eq("id", session.id);
		if (!error) {
			await supabase.from("session_device_changes").insert({
				id: crypto.randomUUID(),
				session_id: session.id,
				from_device: oldDev,
				to_device: newDev,
				note: "تم التبديل من الواجهة",
			});
			onSuccess(
				`تم تحويل الجلسة إلى ${newDev === "laptop" ? "لابتوب" : "موبايل"}`,
			);
		} else {
			onError("خطأ أثناء التبديل");
		}
		setSavingDeviceChange(false);
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[360px] border border-white/10">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-3">
					تبديل الجهاز
				</h2>
				<p className="text-[13px] text-[#9090b0] mb-5">
					الجهاز الحالي:{" "}
					<strong className="text-[#e8e8f5]">
						{session.device === "mobile" ? "موبايل" : "لابتوب"}
					</strong>
					<br />
					سيتم احتساب التكلفة المجزأة بناءً على وقت التبديل.
				</p>
				<div className="flex gap-2.5">
					<button className={`${btnSecondary} flex-1`} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-[2] ${savingDeviceChange ? "opacity-60" : "opacity-100"}`}
						onClick={handleChangeDeviceSave}
						disabled={savingDeviceChange}
					>
						{savingDeviceChange
							? "جاري التبديل..."
							: `تبديل إلى ${session.device === "mobile" ? "لابتوب" : "موبايل"}`}
					</button>
				</div>
			</div>
		</div>
	);
}
