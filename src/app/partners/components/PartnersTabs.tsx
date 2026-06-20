import type { Partner } from "../types";
import { fmt } from "../utils";

interface PartnerStats {
	profitShare: number;
	totalWithdrawals: number;
	totalDeposits: number;
	netBalance: number;
}

interface Props {
	partners: Partner[];
	activePartner: Partner | null;
	setSelectedPartner: (p: Partner) => void;
	getPartnerStats: (p: Partner) => PartnerStats;
}

export default function PartnersTabs({
	partners,
	activePartner,
	setSelectedPartner,
	getPartnerStats,
}: Props) {
	return (
		<div className="flex gap-2 mb-6 flex-wrap">
			{partners.map((p) => {
				const stats = getPartnerStats(p);
				const isActive = activePartner?.id === p.id;
				return (
					<button
						key={p.id}
						onClick={() => setSelectedPartner(p)}
						className={`py-2.5 px-5 rounded-xl border-[1.5px] cursor-pointer text-[13px] transition-all duration-150 ${
							isActive
								? "border-[#4f6ef7] bg-gradient-to-br from-[#4f6ef7]/20 to-[#7c3aed]/15 text-indigo-400 font-bold"
								: "border-white/10 bg-[#111118] text-[#9090b0] font-normal"
						}`}
					>
						{p.name}
						<span
							className={`mr-2 text-[11px] font-bold ${
								stats.netBalance >= 0 ? "text-green-400" : "text-red-400"
							}`}
						>
							{stats.netBalance >= 0 ? "+" : ""}₪{fmt(stats.netBalance)}
						</span>
					</button>
				);
			})}
		</div>
	);
}
