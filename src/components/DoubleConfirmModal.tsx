"use client";
import { useState } from "react";

interface Props {
	isOpen: boolean;
	title?: string;
	message: string;
	confirmWord?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function DoubleConfirmModal({
	isOpen,
	title = "تأكيد أمني مزدوج",
	message,
	confirmWord = "موافق",
	onConfirm,
	onCancel,
}: Props) {
	const [inputVal, setInputVal] = useState("");

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
			<div className="bg-[#111118] rounded-3xl p-8 w-full max-w-[460px] border border-red-400/30 shadow-[0_0_40px_rgba(248,113,113,0.2)]">
				<h2 className="text-[20px] font-bold text-red-400 mb-4 flex items-center gap-2.5">
					<span>⚠️</span> {title}
				</h2>

				<div className="bg-red-400/10 rounded-2xl p-5 border border-red-400/20 mb-6">
					<p className="text-white text-[15px] leading-relaxed">{message}</p>
				</div>

				<div className="mb-6">
					<label className="block text-[#b0b0c0] text-sm mb-2.5">
						للتأكيد، يرجى كتابة كلمة{" "}
						<strong className="text-red-400 bg-red-400/15 px-2 py-0.5 rounded-xl">
							&quot;{confirmWord}&quot;
						</strong>{" "}
						في المربع التالي:
					</label>
					<input
						type="text"
						value={inputVal}
						onChange={(e) => setInputVal(e.target.value)}
						placeholder={`اكتب ${confirmWord}...`}
						className="input-premium bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] px-5 py-3 text-[15px] text-white"
					/>
				</div>

				<div className="flex gap-4">
					<button
						onClick={() => {
							setInputVal("");
							onCancel();
						}}
						className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-full text-white px-6 py-3 text-[15px] cursor-pointer transition-all duration-200"
					>
						تراجع وإلغاء
					</button>
					<button
						onClick={() => {
							if (inputVal.trim() === confirmWord) {
								setInputVal("");
								onConfirm();
							}
						}}
						disabled={inputVal.trim() !== confirmWord}
						className={`flex-1 border rounded-full text-white px-6 py-3 text-[15px] font-bold transition-all duration-200 ${
							inputVal.trim() === confirmWord
								? "bg-gradient-to-br from-red-500 to-red-600 border-red-500 cursor-pointer opacity-100 shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
								: "bg-[#3a3a5a] border-transparent cursor-not-allowed opacity-60 shadow-none"
						}`}
					>
						تأكيد العملية
					</button>
				</div>
			</div>
		</div>
	);
}
