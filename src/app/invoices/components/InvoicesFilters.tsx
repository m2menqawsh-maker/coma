import { exportToCsv } from "@/lib/exportCsv";
import type { Invoice, InvoiceStatus } from "../types";
import { btnSecondary, inputStyle } from "../utils";

interface Props {
	filterSearch: string;
	setFilterSearch: (v: string) => void;
	filterStatus: "all" | InvoiceStatus;
	setFilterStatus: (v: "all" | InvoiceStatus) => void;
	filterDevice: "all" | "mobile" | "laptop";
	setFilterDevice: (v: "all" | "mobile" | "laptop") => void;
	filterDateFrom: string;
	setFilterDateFrom: (v: string) => void;
	filterDateTo: string;
	setFilterDateTo: (v: string) => void;
	invoices: Invoice[];
}

export default function InvoicesFilters({
	filterSearch,
	setFilterSearch,
	filterStatus,
	setFilterStatus,
	filterDevice,
	setFilterDevice,
	filterDateFrom,
	setFilterDateFrom,
	filterDateTo,
	setFilterDateTo,
	invoices,
}: Props) {
	return (
		<div className="bg-[#111118] rounded-xl p-4 border border-white/5 mb-4">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2.5">
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						بحث باسم العميل
					</label>
					<input
						className={inputStyle}
						value={filterSearch}
						onChange={(e) => setFilterSearch(e.target.value)}
						placeholder="اسم العميل..."
					/>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						الحالة
					</label>
					<select
						className={inputStyle}
						value={filterStatus}
						onChange={(e) =>
							setFilterStatus(e.target.value as "all" | InvoiceStatus)
						}
					>
						<option value="all">الكل</option>
						<option value="paid">مدفوع</option>
						<option value="debt">دين</option>
						<option value="partial">جزئي</option>
						<option value="cleared">تمت التصفية</option>
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						الجهاز
					</label>
					<select
						className={inputStyle}
						value={filterDevice}
						onChange={(e) =>
							setFilterDevice(e.target.value as "all" | "mobile" | "laptop")
						}
					>
						<option value="all">الكل</option>
						<option value="mobile">موبايل</option>
						<option value="laptop">لابتوب</option>
					</select>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						من تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={filterDateFrom}
						onChange={(e) => setFilterDateFrom(e.target.value)}
					/>
				</div>
				<div>
					<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
						إلى تاريخ
					</label>
					<input
						className={inputStyle}
						type="date"
						dir="ltr"
						value={filterDateTo}
						onChange={(e) => setFilterDateTo(e.target.value)}
					/>
				</div>
				<div className="flex items-end gap-2">
					<button
						onClick={() => {
							setFilterStatus("all");
							setFilterDevice("all");
							setFilterDateFrom("");
							setFilterDateTo("");
							setFilterSearch("");
						}}
						className={`${btnSecondary} flex-1 text-xs`}
					>
						مسح الفلاتر
					</button>
					<button
						onClick={() => {
							const dataToExport = invoices.map((i) => ({
								"رقم الفاتورة": i.id,
								"تاريخ الجلسة": new Date(i.session_end).toLocaleString("ar-IL"),
								العميل: i.customer_name,
								"نوع الجهاز": i.device === "mobile" ? "موبايل" : "لابتوب",
								"المدة (دقيقة)": Math.round(i.duration_minutes),
								"إجمالي المستحق": i.total_due,
								"مدفوع نقدي": i.cash_paid,
								"مدفوع بنكي": i.bank_paid,
								"دين متبقي": i.debt_created,
								"صافي الربح": i.net_profit,
								"حالة الفاتورة":
									i.status === "paid"
										? "مدفوع"
										: i.status === "debt"
											? "دين"
											: i.status === "partial"
												? "جزئي"
												: "تصفية",
							}));
							exportToCsv("Invoices_Export", dataToExport);
						}}
						className="py-[9px] px-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg cursor-pointer font-semibold text-xs flex items-center gap-1.5"
						title="تصدير Excel"
					>
						<span>📊</span> تصدير
					</button>
				</div>
			</div>
		</div>
	);
}
