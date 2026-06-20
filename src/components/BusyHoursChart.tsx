import {
	Area,
	Bar,
	ComposedChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload?.length) {
		const countData = payload.find((p: any) => p.dataKey === "count");
		const revData = payload.find((p: any) => p.dataKey === "rev");
		return (
			<div className="bg-[#18181b] border border-white/10 rounded-xl p-3 text-white text-[13px] shadow-xl">
				<p className="mb-2 font-medium text-zinc-300">الساعة: {label}</p>
				{countData && (
					<p className="text-amber-400 font-bold m-0 mb-1">
						الازدحام: {countData.value} جلسة
					</p>
				)}
				{revData && (
					<p className="text-indigo-400 font-bold m-0">
						الإيراد: ₪{revData.value.toFixed(2)}
					</p>
				)}
			</div>
		);
	}
	return null;
};

export default function BusyHoursChart({
	data,
}: {
	data: { hour: string; count: number; rev?: number }[];
}) {
	if (!data || data.length === 0) return null;

	// Find max for color scaling
	const maxCount = Math.max(...data.map((d) => d.count), 1);

	return (
		<div className="bg-[#111118] rounded-2xl p-[18px_22px] border border-white/5 transition-all duration-300 privacy-hide-chart">
			<h3 className="m-0 mb-5 text-base text-[#e0e0f0] font-bold">
				ساعات الازدحام (Busy Hours)
			</h3>
			<div className="w-full h-[280px]" dir="ltr">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="rgba(255,255,255,0.05)"
						/>
						<XAxis
							dataKey="hour"
							stroke="#6b6b8a"
							fontSize={11}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							yAxisId="left"
							stroke="#6b6b8a"
							fontSize={11}
							tickLine={false}
							axisLine={false}
							allowDecimals={false}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							stroke="#818cf8"
							fontSize={11}
							tickLine={false}
							axisLine={false}
							hide={true}
						/>
						<Tooltip
							content={<CustomTooltip />}
							cursor={{ fill: "rgba(255,255,255,0.05)" }}
						/>
						<Area
							yAxisId="right"
							type="monotone"
							dataKey="rev"
							stroke="#818cf8"
							fillOpacity={1}
							fill="url(#colorRev)"
							strokeWidth={2}
						/>
						<Bar yAxisId="left" dataKey="count" radius={[6, 6, 0, 0]} barSize={20}>
							{data.map((entry, index) => {
								const intensity = entry.count / maxCount;
								const color =
									intensity > 0.8
										? "#fbbf24" // amber 400
										: intensity > 0.5
											? "#fcd34d" // amber 300
											: "#fef3c7"; // amber 100
								return <Cell key={`cell-${index}`} fill={color} />;
							})}
						</Bar>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
