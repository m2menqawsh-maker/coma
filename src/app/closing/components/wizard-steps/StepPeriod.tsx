import { btnPrimary, btnSecondary, inputStyle } from "../../utils";

interface Props {
	periodFrom: string;
	setPeriodFrom: (v: string) => void;
	periodTo: string;
	setPeriodTo: (v: string) => void;
	label: string;
	setLabel: (v: string) => void;
	onClose: () => void;
	loadPreview: () => void;
	loadingPreview: boolean;
}

export default function StepPeriod({
	periodFrom,
	setPeriodFrom,
	periodTo,
	setPeriodTo,
	label,
	setLabel,
	onClose,
	loadPreview,
	loadingPreview,
}: Props) {
	return (
		<div className="flex flex-col gap-[18px]">
			<div>
				<div className="text-base font-bold text-[#f0f0f8] mb-1.5">
					اختر فترة الجرد
				</div>
				<div className="text-[13px] text-[#6b6b8a]">
					سيتم احتساب كل الفواتير والمصاريف في هذه الفترة
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3.5">
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						من تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={periodFrom}
						onChange={(e) => setPeriodFrom(e.target.value)}
					/>
				</div>
				<div>
					<label className="text-xs text-[#9090b0] block mb-1.5">
						إلى تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={periodTo}
						onChange={(e) => setPeriodTo(e.target.value)}
					/>
				</div>
			</div>

			<div>
				<label className="text-xs text-[#9090b0] block mb-1.5">
					اسم الجرد (اختياري)
				</label>
				<input
					className={inputStyle}
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					placeholder="مثال: جرد مارس 2026..."
				/>
			</div>

			<div>
				<div className="text-xs text-[#6b6b8a] mb-2">اختيارات سريعة</div>
				<div className="flex gap-2 flex-wrap">
					{[
						{
							label: "هذا الشهر",
							action: () => {
								const d = new Date();
								const from = new Date(d.getFullYear(), d.getMonth(), 1)
									.toISOString()
									.split("T")[0];
								const to = new Date().toISOString().split("T")[0];
								setPeriodFrom(from);
								setPeriodTo(to);
							},
						},
						{
							label: "الشهر الماضي",
							action: () => {
								const d = new Date();
								const from = new Date(d.getFullYear(), d.getMonth() - 1, 1)
									.toISOString()
									.split("T")[0];
								const to = new Date(d.getFullYear(), d.getMonth(), 0)
									.toISOString()
									.split("T")[0];
								setPeriodFrom(from);
								setPeriodTo(to);
							},
						},
						{
							label: "آخر 7 أيام",
							action: () => {
								const to = new Date().toISOString().split("T")[0];
								const from = new Date(Date.now() - 6 * 86400000)
									.toISOString()
									.split("T")[0];
								setPeriodFrom(from);
								setPeriodTo(to);
							},
						},
						{
							label: "آخر 30 يوم",
							action: () => {
								const to = new Date().toISOString().split("T")[0];
								const from = new Date(Date.now() - 29 * 86400000)
									.toISOString()
									.split("T")[0];
								setPeriodFrom(from);
								setPeriodTo(to);
							},
						},
					].map((p) => (
						<button
							key={p.label}
							onClick={p.action}
							className={`${btnSecondary} py-1.5 px-3.5 text-xs`}
						>
							{p.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex gap-2.5 mt-2">
				<button className={btnSecondary} onClick={onClose}>
					إلغاء
				</button>
				<button
					className={`${btnPrimary} flex-1 ${loadingPreview ? "opacity-60" : "opacity-100"}`}
					onClick={loadPreview}
					disabled={loadingPreview || !periodFrom || !periodTo}
				>
					{loadingPreview ? "جاري المعاينة..." : "معاينة البيانات ←"}
				</button>
			</div>
		</div>
	);
}
