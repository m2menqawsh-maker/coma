"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface ActivityLog {
	id: string;
	user_id: string;
	action_type: string;
	entity_type: string;
	entity_id: string;
	details: Record<string, unknown>;
	created_at: string;
	user_profiles: { name: string } | null;
}

const ACTION_LABELS: Record<string, string> = {
	create_invoice: "إضافة فاتورة",
	update_invoice: "تعديل فاتورة",
	start_session: "فتح جلسة",
	create_ledger_entry: "إضافة قيد أستاذ",
	create_expense: "إضافة مصروف",
	inventory_movement: "حركة مخزون",
};

const ENTITY_LABELS: Record<string, string> = {
	invoice: "الفواتير",
	session: "الجلسات",
	ledger: "السجل المالي",
	expense: "المصاريف",
	inventory: "المخزون",
};

export default function TrackingPage() {
	const [logs, setLogs] = useState<ActivityLog[]>([]);
	const [loading, setLoading] = useState(true);

	// Filters
	const [filterUser, setFilterUser] = useState<string>("all");
	const [filterAction, setFilterAction] = useState<string>("all");
	const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

	const loadData = useCallback(async () => {
		setLoading(true);

		// Load users for filter
		const { data: usersData } = await supabase
			.from("user_profiles")
			.select("id, name");
		if (usersData) setUsers(usersData);

		let query = supabase
			.from("activity_logs")
			.select("*, user_profiles(name)")
			.order("created_at", { ascending: false });

		if (filterUser !== "all") query = query.eq("user_id", filterUser);
		if (filterAction !== "all") query = query.eq("action_type", filterAction);

		const { data } = await query.limit(100);
		if (data) setLogs(data as ActivityLog[]);
		setLoading(false);
	}, [filterUser, filterAction]);

	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, []);

	const formatDetails = (details: Record<string, unknown> | null) => {
		if (!details) return "-";
		const entries = Object.entries(details).map(([k, v]) => `${k}: ${v}`);
		return entries.join(" | ");
	};

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				<h1 className="text-xl font-bold text-[#f0f0f8] mb-6">
					سجل حركات النظام (Tracking)
				</h1>

				{/* Filters */}
				<div className="bg-[#111118] p-4 rounded-[14px] border border-white/5 mb-5 flex gap-4">
					<div className="flex-1">
						<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
							تصفية بالمستخدم
						</label>
						<select
							value={filterUser}
							onChange={(e) => setFilterUser(e.target.value)}
							className="w-full bg-[#1a1a26] border border-[#2a2a3e] rounded-lg py-2 px-3 text-[#c0c0e0] text-[13px] outline-none focus:border-indigo-500/50 transition-colors"
						>
							<option value="all">الكل</option>
							{users.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name}
								</option>
							))}
						</select>
					</div>
					<div className="flex-1">
						<label className="text-[11px] text-[#6b6b8a] block mb-1.5">
							تصفية بنوع الحركة
						</label>
						<select
							value={filterAction}
							onChange={(e) => setFilterAction(e.target.value)}
							className="w-full bg-[#1a1a26] border border-[#2a2a3e] rounded-lg py-2 px-3 text-[#c0c0e0] text-[13px] outline-none focus:border-indigo-500/50 transition-colors"
						>
							<option value="all">الكل</option>
							{Object.entries(ACTION_LABELS).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Table */}
				<div className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden">
					{loading ? (
						<LoadingSpinner />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse text-[13px]">
								<thead>
									<tr className="border-b border-white/5 bg-white/5">
										<th className="py-3 px-4 text-right text-[#6b6b8a] font-semibold">
											الوقت
										</th>
										<th className="py-3 px-4 text-right text-[#6b6b8a] font-semibold">
											المستخدم
										</th>
										<th className="py-3 px-4 text-right text-[#6b6b8a] font-semibold">
											القسم
										</th>
										<th className="py-3 px-4 text-right text-[#6b6b8a] font-semibold">
											الحركة
										</th>
										<th className="py-3 px-4 text-right text-[#6b6b8a] font-semibold">
											تفاصيل
										</th>
									</tr>
								</thead>
								<tbody>
									{logs.map((log, i) => (
										<tr
											key={log.id}
											className={`${
												i < logs.length - 1 ? "border-b border-white/5" : ""
											} ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"} hover:bg-white/5 transition-colors duration-200`}
										>
											<td className="py-4 px-4 text-[#9090b0] text-[13px]">
												{new Date(log.created_at).toLocaleString("ar-IL")}
											</td>
											<td className="py-4 px-4 text-[#e0e0f0] font-semibold">
												{log.user_profiles?.name || "غير معروف"}
											</td>
											<td className="py-4 px-4 text-indigo-400 text-[13px]">
												{ENTITY_LABELS[log.entity_type] || log.entity_type}
											</td>
											<td className="py-4 px-4 text-green-400 text-[13px]">
												{ACTION_LABELS[log.action_type] || log.action_type}
											</td>
											<td
												className="py-4 px-4 text-[#a0a0c0] text-xs max-w-[400px] whitespace-nowrap overflow-hidden text-ellipsis"
												title={JSON.stringify(log.details)}
											>
												{formatDetails(log.details)}
											</td>
										</tr>
									))}
									{logs.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-10 px-5 text-center text-[#4a4a6a]"
											>
												لا توجد حركات مسجلة
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
