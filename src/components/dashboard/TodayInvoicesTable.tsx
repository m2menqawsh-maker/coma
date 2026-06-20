import { useRouter } from "next/navigation";
import type React from "react";

interface TodayInvoice {
	id: string;
	total_due: number;
	net_profit: number;
	cash_paid: number;
	bank_paid: number;
	debt_created: number;
	session_end: string;
}

interface Props {
	todayInvoices: TodayInvoice[];
	role: "admin" | "partner" | "viewer" | null;
	fmt: (n: unknown) => string;
	className?: string;
	navBtn: (label: string, href: string) => React.ReactNode;
}

export default function TodayInvoicesTable({
	todayInvoices,
	role,
	fmt,
	className = "bg-[#101014] rounded-[20px] border border-white/15",
	navBtn,
}: Props) {
	const router = useRouter();

	if (todayInvoices.length === 0) return null;

	return (
		<div className={className}>
			<div className="px-5 py-4 border-b border-white/15 flex justify-between items-center">
				<div className="text-sm font-bold text-white">فواتير اليوم</div>
				{navBtn("عرض الكل", "/invoices")}
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-[13px]">
					<thead>
						<tr className="border-b border-white/15">
							{["الوقت", "المبلغ", "نقدي", "بنك", "دين"]
								.concat(role !== "viewer" ? ["الربح"] : [])
								.map((h) => (
									<th
										key={h}
										className="px-[18px] py-2.5 text-right text-zinc-400 font-bold text-xs whitespace-nowrap"
									>
										{h}
									</th>
								))}
						</tr>
					</thead>
					<tbody>
						{todayInvoices.slice(0, 8).map((inv, i) => (
							<tr
								key={inv.id}
								onClick={() => router.push("/invoices")}
								className={`cursor-pointer hover:bg-white/10 transition-colors ${
									i < Math.min(todayInvoices.length, 8) - 1
										? "border-b border-white/10"
										: ""
								}`}
							>
								<td className="px-[18px] py-2.5 text-zinc-400 text-[11px] whitespace-nowrap font-medium">
									{new Date(inv.session_end).toLocaleTimeString("ar-IL", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</td>
								<td className="px-[18px] py-2.5 text-blue-400 font-extrabold privacy-blur transition-all duration-300">
									₪{fmt(inv.total_due)}
								</td>
								<td
									className={`px-[18px] py-2.5 font-semibold privacy-blur transition-all duration-300 ${
										inv.cash_paid > 0 ? "text-amber-400" : "text-zinc-500"
									}`}
								>
									{inv.cash_paid > 0 ? `₪${fmt(inv.cash_paid)}` : "—"}
								</td>
								<td
									className={`px-[18px] py-2.5 font-semibold privacy-blur transition-all duration-300 ${
										inv.bank_paid > 0 ? "text-blue-400" : "text-zinc-500"
									}`}
								>
									{inv.bank_paid > 0 ? `₪${fmt(inv.bank_paid)}` : "—"}
								</td>
								<td
									className={`px-[18px] py-2.5 font-semibold privacy-blur transition-all duration-300 ${
										inv.debt_created > 0 ? "text-red-300" : "text-zinc-500"
									}`}
								>
									{inv.debt_created > 0 ? `₪${fmt(inv.debt_created)}` : "—"}
								</td>
								{role !== "viewer" && (
									<td
										className={`px-[18px] py-2.5 font-extrabold privacy-blur transition-all duration-300 ${
											inv.net_profit >= 0 ? "text-green-400" : "text-red-300"
										}`}
									>
										₪{fmt(inv.net_profit)}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
