import type { Partner, PartnerMovement } from "../types";
import { fmt } from "../utils";

interface PartnerStats {
	profitShare: number;
	totalWithdrawals: number;
	totalDeposits: number;
	netBalance: number;
	totalLoansTaken: number;
	totalLoansPaid: number;
	totalDebt: number;
	myMovements: PartnerMovement[];
}

interface Props {
	activePartner: Partner;
	activeStats: PartnerStats;
	totalNetProfit: number;
}

export default function PartnerStatsCards({
	activePartner,
	activeStats,
	totalNetProfit,
}: Props) {
	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mb-6">
			{/* حصة الأرباح */}
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5">
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					حصة الأرباح ({activePartner.share_percent}%)
				</div>
				<div className="text-[26px] font-bold text-indigo-400 privacy-blur transition-all duration-300">
					₪{fmt(activeStats.profitShare)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5 privacy-blur transition-all duration-300">
					من إجمالي ₪{fmt(totalNetProfit)}
				</div>
			</div>

			{/* إجمالي السحوبات */}
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-red-400/15">
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					إجمالي السحوبات
				</div>
				<div className="text-[26px] font-bold text-red-400 privacy-blur transition-all duration-300">
					₪{fmt(activeStats.totalWithdrawals)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5">
					{
						activeStats.myMovements.filter(
							(m) => m.tx_type === "partner_withdrawal",
						).length
					}{" "}
					عملية سحب
				</div>
			</div>

			{/* إجمالي الإيداعات */}
			<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-green-400/15">
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					إجمالي الإيداعات
				</div>
				<div className="text-[26px] font-bold text-green-400 privacy-blur transition-all duration-300">
					₪{fmt(activeStats.totalDeposits)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5">
					{
						activeStats.myMovements.filter(
							(m) => m.tx_type === "partner_deposit",
						).length
					}{" "}
					عملية إيداع
				</div>
			</div>

			{/* الرصيد الصافي للأرباح */}
			<div className="bg-green-400/5 border border-green-400/20 rounded-2xl p-[18px_22px]">
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					الأرباح المتاحة
				</div>
				<div className="text-[26px] font-bold text-green-400 privacy-blur transition-all duration-300">
					₪{fmt(activeStats.netBalance)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5">
					متاح للسحب
				</div>
			</div>

			{/* الديون المستحقة */}
			<div
				className={`rounded-2xl p-[18px_22px] border ${
					activeStats.totalDebt > 0
						? "bg-red-400/5 border-red-400/20"
						: "bg-[#111118] border-white/5"
				}`}
			>
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					الديون والسلف
				</div>
				<div
					className={`text-[26px] font-bold privacy-blur transition-all duration-300 ${
						activeStats.totalDebt > 0 ? "text-red-400" : "text-[#f0f0f8]"
					}`}
				>
					₪{fmt(activeStats.totalDebt)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5">
					{activeStats.totalDebt > 0 ? "مستحق على الشريك" : "لا يوجد ديون"}
				</div>
			</div>
		</div>
	);
}
