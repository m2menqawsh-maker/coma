import type { BankAccountDetail } from "../types";
import { ACCOUNT_TYPE_LABELS, fmt } from "../utils";

interface Props {
	accounts: BankAccountDetail[];
	selectedAccount: BankAccountDetail | null;
	onSelectAccount: (acc: BankAccountDetail | null) => void;
	totalBal: number;
}

export default function BankCards({
	accounts,
	selectedAccount,
	onSelectAccount,
	totalBal,
}: Props) {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
			<div
				onClick={() => onSelectAccount(null)}
				className={`rounded-2xl p-[18px_22px] cursor-pointer transition-all duration-150 border-[1.5px] ${
					selectedAccount === null
						? "bg-gradient-to-br from-indigo-400/15 to-violet-500/10 border-indigo-500"
						: "bg-[#111118] border-white/[0.07]"
				}`}
			>
				<div className="text-[11px] text-[#6b6b8a] mb-2 uppercase tracking-[1px]">
					كل الحسابات
				</div>
				<div className="text-[26px] font-bold text-indigo-400">
					₪{fmt(totalBal)}
				</div>
				<div className="text-[11px] text-[#4a4a6a] mt-1.5">
					{accounts.length} حساب
				</div>
			</div>

			{accounts.map((acc) => (
				<div
					key={acc.id}
					onClick={() =>
						onSelectAccount(acc.id === selectedAccount?.id ? null : acc)
					}
					className={`rounded-2xl p-[18px_22px] cursor-pointer relative transition-all duration-150 border-[1.5px] ${
						selectedAccount?.id === acc.id
							? "bg-gradient-to-br from-blue-400/12 to-indigo-400/5 border-blue-400"
							: "bg-[#111118] border-white/[0.07]"
					}`}
				>
					{acc.pending_count > 0 && (
						<div className="absolute top-3.5 left-3.5 w-5 h-5 rounded-full bg-amber-400 text-[#0d0d14] text-[10px] font-bold flex items-center justify-center">
							{acc.pending_count}
						</div>
					)}
					<div className="text-[11px] text-[#6b6b8a] mb-1 uppercase tracking-[1px]">
						{ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}
					</div>
					<div className="text-sm font-semibold text-[#e0e0f0] mb-2">
						{acc.name}
					</div>
					<div
						className={`text-2xl font-bold ${
							acc.balance >= 0 ? "text-blue-400" : "text-red-400"
						}`}
					>
						₪{fmt(acc.balance)}
					</div>
					<div className="flex gap-4 mt-2.5">
						<div>
							<div className="text-[10px] text-[#6b6b8a]">وارد</div>
							<div className="text-xs font-bold text-green-400">
								₪{fmt(acc.total_in)}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-[#6b6b8a]">صادر</div>
							<div className="text-xs font-bold text-red-400">
								₪{fmt(acc.total_out)}
							</div>
						</div>
						{acc.pending_in > 0 && (
							<div>
								<div className="text-[10px] text-[#6b6b8a]">معلّق</div>
								<div className="text-xs font-bold text-amber-400">
									₪{fmt(acc.pending_in)}
								</div>
							</div>
						)}
					</div>
					{acc.phone && (
						<div className="text-[11px] text-[#4a4a6a] mt-2">{acc.phone}</div>
					)}
				</div>
			))}
		</div>
	);
}
