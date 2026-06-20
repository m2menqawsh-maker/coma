import type React from "react";
import type { PricingConfig, SessionDeviceChange } from "@/app/sessions/types";

interface ActiveSession {
	id: string;
	customer_name: string;
	device: "mobile" | "laptop";
	start_time: string;
}

interface Props {
	activeSessions: ActiveSession[];
	activeDeviceChanges: SessionDeviceChange[];
	pricing: PricingConfig;
	role: "admin" | "partner" | "viewer" | null;
	fmt: (n: unknown) => string;
	calcDuration: (startTime: string) => string;
	calcSessionAmount: (
		startTime: string,
		device: "mobile" | "laptop",
		pricing: PricingConfig,
		changes: SessionDeviceChange[],
	) => number;
	className?: string;
	navBtn: (label: string, href: string) => React.ReactNode;
}

export default function ActiveSessionsList({
	activeSessions,
	activeDeviceChanges,
	pricing,
	role,
	fmt,
	calcDuration,
	calcSessionAmount,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
	navBtn,
}: Props) {
	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15 flex justify-between items-center">
				<div className="text-sm font-bold text-white flex items-center">
					الجلسات النشطة
					{activeSessions.length > 0 && (
						<span className="mr-2 bg-[#4f6ef7]/30 text-indigo-300 rounded-full px-2 py-0.5 text-[11px]">
							{activeSessions.length}
						</span>
					)}
				</div>
				{navBtn("عرض الكل", "/sessions")}
			</div>
			{activeSessions.length === 0 ? (
				<div className="text-center py-10 px-5 text-zinc-500">
					<div className="text-[28px] mb-2">◷</div>
					<div className="text-[13px]">لا توجد جلسات نشطة</div>
				</div>
			) : (
				activeSessions.slice(0, 6).map((sess, i) => {
					const changes = activeDeviceChanges.filter(
						(c) => c.session_id === sess.id,
					);
					const initialDev =
						changes.length > 0
							? [...changes].sort(
									(a, b) =>
										new Date(a.changed_at).getTime() -
										new Date(b.changed_at).getTime(),
								)[0].from_device
							: sess.device;
					const amount = calcSessionAmount(
						sess.start_time,
						initialDev as "mobile" | "laptop",
						pricing,
						changes,
					);
					return (
						<div
							key={sess.id}
							className={`px-5 py-[13px] flex justify-between items-center ${
								i < Math.min(activeSessions.length, 6) - 1
									? "border-b border-white/10"
									: ""
							}`}
						>
							<div className="flex items-center gap-3">
								<div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] shrink-0" />
								<div>
									<div className="text-[13px] font-bold text-white">
										{sess.customer_name}
									</div>
									<div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
										{sess.device === "mobile" ? "📱" : "💻"} ·{" "}
										{calcDuration(sess.start_time)}
									</div>
								</div>
							</div>
							{role !== "viewer" && (
								<div className="text-left">
									<div className="text-sm font-extrabold text-blue-400">
										₪{fmt(amount)}
									</div>
									<div className="text-[10px] text-zinc-500 mt-0.5 font-semibold">
										لحظي
									</div>
								</div>
							)}
						</div>
					);
				})
			)}
		</div>
	);
}
