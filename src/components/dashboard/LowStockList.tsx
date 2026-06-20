import type React from "react";

interface LowStockItem {
	id: string;
	name: string;
	qty: number;
	low_stock_threshold: number;
	unit: string | null;
}

interface Props {
	lowStock: LowStockItem[];
	className?: string;
	navBtn: (label: string, href: string) => React.ReactNode;
}

export default function LowStockList({
	lowStock,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
	navBtn,
}: Props) {
	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15 flex justify-between items-center">
				<div className="text-sm font-bold text-white flex items-center">
					تنبيهات المخزون
					{lowStock.length > 0 && (
						<span className="mr-2 bg-red-400/30 text-red-300 rounded-full px-2 py-0.5 text-[11px]">
							{lowStock.length}
						</span>
					)}
				</div>
				{navBtn("المخزون", "/inventory")}
			</div>
			{lowStock.length === 0 ? (
				<div className="py-7 px-5 text-center">
					<div className="text-[22px] mb-2">✓</div>
					<div className="text-[13px] text-green-400 font-semibold">
						المخزون بخير
					</div>
				</div>
			) : (
				lowStock.slice(0, 5).map((item, i) => (
					<div
						key={item.id}
						className={`px-5 py-2.5 flex justify-between items-center ${
							i < Math.min(lowStock.length, 5) - 1
								? "border-b border-white/10"
								: ""
						}`}
					>
						<div>
							<div className="text-[13px] text-white font-semibold">
								{item.name}
							</div>
							<div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
								الحد: {item.low_stock_threshold} {item.unit || ""}
							</div>
						</div>
						<div
							className={`border rounded-lg px-2.5 py-1 text-[13px] font-bold ${
								item.qty === 0
									? "bg-red-400/15 border-red-400/30 text-red-400"
									: "bg-amber-400/15 border-amber-400/30 text-amber-400"
							}`}
						>
							{item.qty} {item.unit || ""}
						</div>
					</div>
				))
			)}
		</div>
	);
}
