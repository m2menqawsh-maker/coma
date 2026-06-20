"use client";
import type {
	Device,
	PricingConfig,
	Session,
	SessionDeviceChange,
	SessionOrder,
} from "../types";
import {
	btnPrimary,
	btnSecondary,
	calcOrdersTotal,
	calcSessionAmount,
	formatDuration,
	getCurrentDevice,
	getInitialDevice,
} from "../utils";

interface SessionCardProps {
	session: Session;
	orders: SessionOrder[];
	deviceChanges: SessionDeviceChange[];
	pricing: PricingConfig;
	onAddOrder: (id: string) => void;
	onCheckout: (s: Session) => void;
	onEdit: (s: Session) => void;
	onDelete: (id: string) => void;
	onChangeDevice: (s: Session) => void;
	onPauseResume: (s: Session, toDevice: Device) => void;
	hasActiveSubscription?: boolean;
}

export default function SessionCard({
	session: s,
	orders: sOrders,
	deviceChanges: changes,
	pricing,
	onAddOrder,
	onCheckout,
	onEdit,
	onDelete,
	onChangeDevice,
	onPauseResume,
	hasActiveSubscription,
}: SessionCardProps) {
	const initialDev = getInitialDevice(s, changes);
	const currentDev = getCurrentDevice(s, changes);
	const sAmount = calcSessionAmount(s.start_time, initialDev, pricing, changes);
	const oTotal = calcOrdersTotal(sOrders);
	const total = sAmount + oTotal;

	return (
		<div className="bg-[#111118] rounded-[14px] border border-white/5 p-5 flex flex-col gap-3.5">
			<div className="flex justify-between items-start">
				<div>
					<div className="text-[15px] font-bold text-[#e8e8f5] flex items-center gap-1.5">
						{s.customer_name}
						{hasActiveSubscription && (
							<span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded ml-1" title="لديه اشتراك فعال">
								🌟 اشتراك
							</span>
						)}
						<button
							onClick={() => onEdit(s)}
							title="تعديل الجلسة"
							className="bg-transparent border-none text-[#6b6b8a] cursor-pointer text-[13px] p-0 hover:text-indigo-400 transition-colors"
						>
							⚙️
						</button>
						<button
							onClick={() => onDelete(s.id)}
							title="حذف الجلسة"
							className="bg-transparent border-none text-red-500 cursor-pointer text-[13px] p-0 hover:text-red-400 transition-colors"
						>
							🗑️
						</button>
					</div>
					<div className="text-xs text-[#6b6b8a] mt-1 flex items-center gap-1.5">
						<span>
							{currentDev === "mobile"
								? "📱 موبايل"
								: currentDev === "laptop"
									? "💻 لابتوب"
									: "⏸️ متوقف"}
						</span>
						{currentDev !== "paused" && (
							<>
								<button
									onClick={() => onChangeDevice(s)}
									title="تبديل الجهاز"
									className="bg-indigo-400/10 border border-indigo-400/30 rounded text-indigo-400 cursor-pointer text-[10px] py-0.5 px-1.5 hover:bg-indigo-400/20 transition-colors"
								>
									🔄
								</button>
								<button
									onClick={() => onPauseResume(s, "paused")}
									title="إيقاف مؤقت"
									className="bg-amber-400/10 border border-amber-400/30 rounded text-amber-400 cursor-pointer text-[10px] py-0.5 px-1.5 hover:bg-amber-400/20 transition-colors"
								>
									⏸️
								</button>
							</>
						)}
						<span>· {formatDuration(s.start_time, initialDev, changes)}</span>
					</div>
				</div>
				<div
					className={`rounded-lg py-1 px-2.5 text-[13px] font-bold ${
						currentDev === "paused"
							? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
							: "bg-indigo-400/10 border border-indigo-400/20 text-indigo-400"
					}`}
				>
					₪{total.toFixed(2)}
				</div>
			</div>

			<div className="bg-[#0d0d14] rounded-lg py-2.5 px-3 text-xs text-[#6b6b8a] flex flex-col gap-1.5">
				<div className="flex justify-between">
					<span>الجلسة</span>
					<span className="text-[#9090b0]">₪{sAmount.toFixed(2)}</span>
				</div>
				{sOrders.length > 0 && (
					<div className="flex justify-between">
						<span>المنتجات ({sOrders.length})</span>
						<span className="text-[#9090b0]">₪{oTotal.toFixed(2)}</span>
					</div>
				)}
			</div>

			{sOrders.length > 0 && (
				<div className="flex flex-col gap-1">
					{sOrders.map((o) => (
						<div
							key={o.id}
							className="text-xs text-[#7070a0] flex justify-between"
						>
							<span>
								{o.product_name}
								{o.size ? ` (${o.size === "small" ? "صغير" : "كبير"})` : ""} ×
								{o.quantity}
							</span>
							<span>₪{(o.price_per_unit * o.quantity).toFixed(2)}</span>
						</div>
					))}
				</div>
			)}

			{currentDev === "paused" ? (
				<div className="flex gap-2 mt-1">
					<button
						onClick={() => onPauseResume(s, "mobile")}
						className={`${btnPrimary} bg-gradient-to-br from-emerald-500 to-emerald-600 flex-1 text-xs`}
					>
						استئناف 📱
					</button>
					<button
						onClick={() => onPauseResume(s, "laptop")}
						className={`${btnPrimary} bg-gradient-to-br from-sky-500 to-sky-600 flex-1 text-xs`}
					>
						استئناف 💻
					</button>
				</div>
			) : (
				<div className="flex gap-2 mt-1">
					<button
						onClick={() => onAddOrder(s.id)}
						className={`${btnSecondary} flex-1 text-xs`}
					>
						+ طلب
					</button>
					<button
						onClick={() => onCheckout(s)}
						className={`${btnPrimary} flex-1 text-xs`}
					>
						إغلاق وتسديد
					</button>
				</div>
			)}
		</div>
	);
}
