"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { usePrivacy } from "@/components/PrivacyProvider";
import { createClient } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { id: string; label: string; icon: string; items: NavItem[] };

const navGroups: NavGroup[] = [
	{
		id: "core",
		label: "العمليات الأساسية",
		icon: "📊",
		items: [
			{ href: "/", label: "الرئيسية", icon: "⊞" },
			{ href: "/sessions", label: "الجلسات", icon: "◷" },
			{ href: "/invoices", label: "الفواتير", icon: "◈" },
			{ href: "/subscriptions", label: "الاشتراكات", icon: "🎟️" },
		],
	},
	{
		id: "finance",
		label: "المالية والحسابات",
		icon: "💰",
		items: [
			{ href: "/expenses", label: "المصاريف", icon: "◉" },
			{ href: "/obligations", label: "الالتزامات", icon: "◎" },
			{ href: "/banks", label: "الحسابات البنكية", icon: "⬡" },
			{ href: "/ledger", label: "السجل المالي", icon: "≡" },
		],
	},
	{
		id: "management",
		label: "الإدارة والتقارير",
		icon: "📈",
		items: [
			{ href: "/partners", label: "الشركاء", icon: "◑" },
			{ href: "/inventory", label: "المخزون", icon: "▦" },
			{ href: "/reports", label: "التقارير", icon: "◈" },
			{ href: "/closing", label: "الجرد المالي", icon: "⊛" },
		],
	},
	{
		id: "system",
		label: "النظام والإعدادات",
		icon: "⚙️",
		items: [
			{ href: "/users", label: "المستخدمين", icon: "👥" },
			{ href: "/tracking", label: "سجل الحركات", icon: "📋" },
			{ href: "/settings", label: "الإعدادات", icon: "◎" },
		],
	},
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false);
	const [role, setRole] = useState<"admin" | "partner" | "viewer" | null>(null);
	const [openGroup, setOpenGroup] = useState<string | null>(null);

	const pathname = usePathname();
	const router = useRouter();
	const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

	useEffect(() => {
		async function fetchRole() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/login");
				return;
			}
			const { data } = await supabase
				.from("user_profiles")
				.select("role")
				.eq("id", user.id)
				.single();
			if (data) setRole(data.role);
		}
		fetchRole();
	}, [router]);

	// Auto-open group based on current pathname
	useEffect(() => {
		if (collapsed) return;
		const activeGroup = navGroups.find((g) =>
			g.items.some((i) => i.href === pathname),
		);
		if (activeGroup && !openGroup) {
			setOpenGroup(activeGroup.id);
		}
	}, [pathname, collapsed, openGroup]);

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
	};

	const filterItems = (items: NavItem[]) => {
		return items.filter((item) => {
			if (role === "viewer") {
				return ["/", "/sessions", "/invoices", "/inventory", "/subscriptions"].includes(
					item.href,
				);
			}
			if (role === "partner") {
				return item.href !== "/users";
			}
			return true;
		});
	};

	return (
		<div
			dir="rtl"
			className="flex min-h-screen bg-[#030303] font-['Segoe_UI',_Tahoma,_sans-serif] text-white"
		>
			{/* Sidebar */}
			<aside
				className={`fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-black border-l border-white/10 transition-[width] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
					collapsed ? "w-[72px]" : "w-[260px]"
				}`}
			>
				{/* Logo */}
				<div
					className={`flex items-center gap-3 border-b border-white/5 ${
						collapsed ? "justify-center py-6 px-0" : "justify-between py-7 px-6"
					}`}
				>
					<div className="flex items-center gap-2.5">
						<div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[13px] font-bold text-white shrink-0">
							LG
						</div>
						{!collapsed && (
							<span className="text-base font-extrabold text-white whitespace-nowrap tracking-wide">
								Ledgr
							</span>
						)}
					</div>

					{!collapsed && (
						<button
							onClick={() => setCollapsed(true)}
							className="bg-transparent border-none text-zinc-400 cursor-pointer text-base p-1 leading-none"
						>
							›
						</button>
					)}
				</div>

				{/* Collapse button when collapsed */}
				{collapsed && (
					<button
						onClick={() => setCollapsed(false)}
						className="bg-transparent border-none text-zinc-400 cursor-pointer text-base py-2 text-center border-b border-white/10"
					>
						‹
					</button>
				)}

				{/* Nav */}
				<nav className="flex-1 py-6 px-4 overflow-y-auto flex flex-col gap-4 no-scrollbar">
					{navGroups.map((group) => {
						const filteredItems = filterItems(group.items);
						if (filteredItems.length === 0) return null;

						const isGroupOpen = openGroup === group.id;

						if (collapsed) {
							// Collapsed mode: Flat icons separated by borders for groups
							return (
								<div
									key={group.id}
									className="flex flex-col gap-1.5 pb-4 border-b border-white/5 last:border-0 last:pb-0"
								>
									{filteredItems.map((item) => {
										const active = pathname === item.href;
										return (
											<button
												key={item.href}
												onClick={() => router.push(item.href)}
												title={item.label}
												className={`w-full flex justify-center items-center rounded-2xl cursor-pointer py-3 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${
													active
														? "bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-400 shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-blue-400/20"
														: "bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-white"
												}`}
											>
												<span className="text-xl">{item.icon}</span>
											</button>
										);
									})}
								</div>
							);
						}

						// Expanded mode: Accordions
						return (
							<div key={group.id} className="flex flex-col">
								<button
									onClick={() => setOpenGroup(isGroupOpen ? null : group.id)}
									className="flex items-center justify-between w-full text-right bg-transparent border-none cursor-pointer py-1.5 px-3 text-[#9a9aab] hover:text-white transition-colors group/header"
								>
									<div className="flex items-center gap-3">
										<span className="text-lg opacity-80">{group.icon}</span>
										<span className="text-[13px] font-bold tracking-wide">
											{group.label}
										</span>
									</div>
									<span
										className={`text-[9px] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
											isGroupOpen
												? "rotate-0 text-white"
												: "rotate-90 text-zinc-500 group-hover/header:text-zinc-300"
										}`}
									>
										▼
									</span>
								</button>

								<div
									className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
										isGroupOpen
											? "grid-rows-[1fr] opacity-100 mt-2"
											: "grid-rows-[0fr] opacity-0 mt-0"
									}`}
								>
									<div className="overflow-hidden flex flex-col gap-1 pr-3 border-r-[1.5px] border-white/5 mr-5">
										{filteredItems.map((item) => {
											const active = pathname === item.href;
											return (
												<button
													key={item.href}
													onClick={() => router.push(item.href)}
													className={`w-full flex items-center gap-3 rounded-xl cursor-pointer text-[13px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap border py-2.5 px-3.5 ${
														active
															? "bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-400 font-bold border-blue-400/20"
															: "bg-transparent text-zinc-400 font-medium border-transparent hover:bg-white/5 hover:text-white"
													}`}
												>
													<span
														className={`text-base shrink-0 transition-colors duration-200 ${
															active ? "text-blue-400" : "text-zinc-500"
														}`}
													>
														{item.icon}
													</span>
													<span>{item.label}</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>
						);
					})}
				</nav>

				{/* Privacy Toggle & Logout */}
				<div className="p-4 border-t border-white/5 flex flex-col gap-2 shrink-0">
					<button
						onClick={togglePrivacyMode}
						title={
							collapsed
								? isPrivacyMode
									? "إظهار الأرقام"
									: "إخفاء الأرقام"
								: undefined
						}
						className={`w-full flex items-center gap-2.5 rounded-[9px] border-none bg-transparent cursor-pointer text-[13px] font-medium transition-all duration-150 hover:bg-white/5 hover:text-white ${
							isPrivacyMode ? "text-blue-400" : "text-zinc-400"
						} ${collapsed ? "justify-center py-2.5 px-0" : "justify-start py-2.5 px-3"}`}
					>
						<span className="text-[15px]">{isPrivacyMode ? "🙈" : "👁️"}</span>
						{!collapsed && (
							<span>{isPrivacyMode ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
						)}
					</button>
					<button
						onClick={handleLogout}
						title={collapsed ? "خروج" : undefined}
						className={`w-full flex items-center gap-2.5 rounded-[9px] border-none bg-transparent text-zinc-400 cursor-pointer text-[13px] font-medium transition-all duration-150 hover:bg-red-500/15 hover:text-red-400 ${
							collapsed
								? "justify-center py-2.5 px-0"
								: "justify-start py-2.5 px-3"
						}`}
					>
						<span className="text-[15px]">⊗</span>
						{!collapsed && <span>خروج</span>}
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main
				className={`flex-1 min-h-screen flex flex-col relative transition-[margin-right] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
					collapsed ? "mr-[72px]" : "mr-[260px]"
				}`}
			>
				<Toaster
					position="top-center"
					toastOptions={{
						style: {
							background: "#18181b",
							color: "#fff",
							border: "1px solid rgba(255,255,255,0.1)",
						},
					}}
				/>
				<div className="flex-1">{children}</div>
			</main>
		</div>
	);
}
