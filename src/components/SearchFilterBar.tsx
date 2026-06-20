interface SearchFilterBarProps {
	searchPlaceholder?: string;
	searchValue: string;
	onSearchChange: (val: string) => void;
	onExportExcel?: () => void;
}

export default function SearchFilterBar({
	searchPlaceholder = "ابحث...",
	searchValue,
	onSearchChange,
	onExportExcel,
}: SearchFilterBarProps) {
	return (
		<div className="flex justify-between items-center gap-4 mb-6 bg-[#101014] px-4 py-3 rounded-2xl border border-white/10 flex-wrap">
			<div className="flex-1 min-w-[250px] relative">
				<input
					type="text"
					placeholder={searchPlaceholder}
					value={searchValue}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.1)]"
				/>
			</div>

			<div className="flex gap-3">
				{onExportExcel && (
					<button
						onClick={onExportExcel}
						className="px-4 py-2.5 bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 text-green-400 rounded-xl cursor-pointer font-semibold text-[13px] flex items-center gap-2 transition-colors duration-200"
					>
						<span>📊</span> تصدير Excel
					</button>
				)}
			</div>
		</div>
	);
}
