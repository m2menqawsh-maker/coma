"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchFilterBar from "@/components/SearchFilterBar";
import { exportToCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface UserProfile {
	id: string;
	name: string;
	role: "admin" | "partner" | "viewer";
	created_at: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

	const [searchUser, setSearchUser] = useState("");

	// Add user modal
	const [showAddModal, setShowAddModal] = useState(false);
	const [addForm, setAddForm] = useState({
		name: "",
		email: "",
		password: "",
		role: "viewer",
	});
	const [addingUser, setAddingUser] = useState(false);

	const loadData = async () => {
		setLoading(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user) {
			const { data: profile } = await supabase
				.from("user_profiles")
				.select("role")
				.eq("id", user.id)
				.single();
			setCurrentUserRole(profile?.role || null);
		}

		const { data, error } = await supabase
			.from("user_profiles")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) {
			toast.error("خطأ في تحميل المستخدمين");
		} else {
			setUsers(data as UserProfile[]);
		}
		setLoading(false);
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleRoleChange = async (userId: string, newRole: string) => {
		if (currentUserRole !== "admin") {
			toast.error("ليس لديك صلاحية لتعديل الرتب");
			return;
		}

		const { error } = await supabase
			.from("user_profiles")
			.update({ role: newRole })
			.eq("id", userId);
		if (error) {
			toast.error("حدث خطأ أثناء التحديث");
		} else {
			toast.success("تم تحديث الرتبة بنجاح");
			setUsers(
				users.map((u) =>
					u.id === userId
						? { ...u, role: newRole as "admin" | "partner" | "viewer" }
						: u,
				),
			);
		}
	};

	const handleAddUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (currentUserRole !== "admin") return;

		setAddingUser(true);
		try {
			const res = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(addForm),
			});
			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "حدث خطأ أثناء إضافة المستخدم");
			} else {
				toast.success("تمت إضافة المستخدم بنجاح");
				setShowAddModal(false);
				setAddForm({ name: "", email: "", password: "", role: "viewer" });
				loadData(); // Reload users list
			}
		} catch {
			toast.error("خطأ في الاتصال بالخادم");
		}
		setAddingUser(false);
	};

	const inputStyle =
		"bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg px-3.5 py-2.5 text-[13px] text-[#e8e8f5] w-full outline-none box-border mb-3 h-[42px] focus:border-indigo-500/50 transition-colors";

	return (
		<AppLayout>
			<div className="py-8 px-10 max-w-[1200px] mx-auto">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-xl font-bold text-[#f0f0f8]">
						إدارة المستخدمين والصلاحيات
					</h1>
					{currentUserRole === "admin" && (
						<button
							onClick={() => setShowAddModal(true)}
							className="bg-gradient-to-br from-indigo-500 to-violet-600 border-none rounded-lg text-white px-5 py-2.5 text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
						>
							+ إضافة مستخدم
						</button>
					)}
				</div>

				<SearchFilterBar
					searchPlaceholder="ابحث باسم المستخدم..."
					searchValue={searchUser}
					onSearchChange={setSearchUser}
					onExportExcel={() => {
						const data = users
							.filter((u) =>
								(u.name || "").toLowerCase().includes(searchUser.toLowerCase()),
							)
							.map((u) => ({
								الاسم: u.name,
								الرتبة:
									u.role === "admin"
										? "مسؤول"
										: u.role === "partner"
											? "شريك"
											: "موظف",
								"تاريخ الانضمام": new Date(u.created_at).toLocaleDateString(
									"ar-IL",
								),
							}));
						exportToCsv("Users_Export", data);
					}}
				/>

				<div className="bg-[#111118] rounded-2xl border border-white/5 overflow-hidden mt-6">
					{loading ? (
						<LoadingSpinner />
					) : (
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr className="border-b border-white/5 bg-white/5">
									<th className="py-3 px-5 text-right text-[#6b6b8a] font-semibold">
										الاسم
									</th>
									<th className="py-3 px-5 text-right text-[#6b6b8a] font-semibold">
										الرتبة
									</th>
									<th className="py-3 px-5 text-right text-[#6b6b8a] font-semibold">
										تاريخ الانضمام
									</th>
								</tr>
							</thead>
							<tbody>
								{users
									.filter((u) =>
										(u.name || "")
											.toLowerCase()
											.includes(searchUser.toLowerCase()),
									)
									.map((u, i, arr) => (
										<tr
											key={u.id}
											className={`${
												i < arr.length - 1 ? "border-b border-white/5" : ""
											} ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"} hover:bg-white/5 transition-colors duration-200`}
										>
											<td className="py-4.5 px-5 text-[#e0e0f0] font-semibold">
												{u.name || "بدون اسم"}
											</td>
											<td className="py-4.5 px-5">
												<select
													value={u.role}
													onChange={(e) =>
														handleRoleChange(u.id, e.target.value)
													}
													disabled={currentUserRole !== "admin"}
													className={`bg-[#1a1a26] border border-[#2a2a3e] rounded-lg py-2 px-3.5 text-[#c0c0e0] text-[13px] outline-none min-w-[140px] ${currentUserRole === "admin" ? "cursor-pointer opacity-100 focus:border-indigo-500/50 transition-colors" : "cursor-not-allowed opacity-70"}`}
												>
													<option value="admin">مسؤول</option>
													<option value="partner">شريك</option>
													<option value="viewer">موظف</option>
												</select>
											</td>
											<td className="py-4 px-5 text-[#6b6b8a] text-[13px]">
												{new Date(u.created_at).toLocaleDateString("ar-IL")}
											</td>
										</tr>
									))}
								{users.filter((u) =>
									(u.name || "")
										.toLowerCase()
										.includes(searchUser.toLowerCase()),
								).length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="py-10 px-5 text-center text-[#4a4a6a]"
										>
											لا يوجد مستخدمين مسجلين
										</td>
									</tr>
								)}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{showAddModal && (
				<div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
					<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[400px] border border-white/10">
						<h2 className="text-base font-bold text-[#f0f0f8] mb-5">
							إضافة مستخدم جديد
						</h2>

						<form onSubmit={handleAddUser}>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								اسم المستخدم
							</label>
							<input
								required
								className={inputStyle}
								value={addForm.name}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, name: e.target.value }))
								}
								placeholder="الاسم الكامل"
							/>

							<label className="text-xs text-[#9090b0] block mb-1.5">
								البريد الإلكتروني
							</label>
							<input
								required
								type="email"
								className={inputStyle}
								value={addForm.email}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, email: e.target.value }))
								}
								placeholder="email@example.com"
								dir="ltr"
							/>

							<label className="text-xs text-[#9090b0] block mb-1.5">
								كلمة المرور
							</label>
							<input
								required
								type="password"
								className={inputStyle}
								value={addForm.password}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, password: e.target.value }))
								}
								placeholder="••••••••"
								dir="ltr"
							/>

							<label className="text-xs text-[#9090b0] block mb-1.5">
								الرتبة والصلاحية
							</label>
							<select
								className={inputStyle}
								value={addForm.role}
								onChange={(e) =>
									setAddForm((f) => ({ ...f, role: e.target.value }))
								}
							>
								<option value="viewer">موظف (محدود)</option>
								<option value="partner">شريك (شبه كامل)</option>
								<option value="admin">مسؤول (كامل الصلاحيات)</option>
							</select>

							<div className="flex gap-2.5 mt-2.5">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="bg-white/5 border border-white/10 rounded-lg text-[#9090b0] px-5 py-2.5 text-[13px] cursor-pointer hover:bg-white/10 transition-colors"
								>
									إلغاء
								</button>
								<button
									type="submit"
									disabled={addingUser}
									className={`bg-gradient-to-br from-indigo-500 to-violet-600 border-none rounded-lg text-white px-5 py-2.5 text-[13px] font-semibold flex-1 ${addingUser ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90 transition-opacity"}`}
								>
									{addingUser ? "جاري الإضافة..." : "إضافة"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppLayout>
	);
}
