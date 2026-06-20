import { fmt } from "../utils";

interface Props {
	totalIn: number;
	totalOut: number;
	totalPending: number;
	transfersCount: number;
}

export default function BanksSummaryBar({
	totalIn,
	totalOut,
	totalPending,
	transfersCount,
}: Props) {
	return (
		<div className="flex gap-3 flex-wrap">
			{[
				{
					label: "وارد مؤكد",
					value: totalIn,
					colorClass: "text-green-400",
					bgClass: "bg-green-400/[0.08]",
					borderClass: "border-green-400/[0.15]",
				},
				{
					label: "صادر",
					value: totalOut,
					colorClass: "text-red-400",
					bgClass: "bg-red-400/[0.08]",
					borderClass: "border-red-400/[0.15]",
				},
				{
					label: "معلّق (غير مصدَّق)",
					value: totalPending,
					colorClass: "text-amber-400",
					bgClass: "bg-amber-400/[0.08]",
					borderClass: "border-amber-400/[0.15]",
				},
			].map((s) => (
				<div
					key={s.label}
					className={`${s.bgClass} border ${s.borderClass} rounded-[10px] py-2 px-4 text-[13px]`}
				>
					<span className="text-[#6b6b8a]">{s.label}: </span>
					<span className={`${s.colorClass} font-bold`}>₪{fmt(s.value)}</span>
				</div>
			))}
			<div className="mr-auto flex items-center text-xs text-[#4a4a6a]">
				{transfersCount} حوالة
			</div>
		</div>
	);
}
