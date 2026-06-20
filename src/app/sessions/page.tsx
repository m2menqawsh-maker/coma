"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchFilterBar from "@/components/SearchFilterBar";
import { createClient } from "@/lib/supabase/client";
import { getOfflineStateManager } from "@/lib/offline/offlineStateManager";
import AddOrderModal from "./components/AddOrderModal";
import ChangeDeviceModal from "./components/ChangeDeviceModal";
import CheckoutModal from "./components/CheckoutModal";
import EditSessionModal from "./components/EditSessionModal";
import GroupCheckoutModal from "./components/GroupCheckoutModal";
import NewSessionModal from "./components/NewSessionModal";
import SessionCard from "./components/SessionCard";
import type {
	BankAccount,
	PricingConfig,
	Product,
	Session,
	SessionDeviceChange,
	SessionOrder,
	Package,
	PackageItem,
} from "./types";
import { btnPrimary, DEFAULT_PRICING } from "./utils";

const supabase = createClient();

export default function SessionsPage() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [orders, setOrders] = useState<Record<string, SessionOrder[]>>({});
	const [deviceChanges, setDeviceChanges] = useState<
		Record<string, SessionDeviceChange[]>
	>({});
	const [products, setProducts] = useState<Product[]>([]);
	const [packages, setPackages] = useState<Package[]>([]);
	const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
	const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [activeSubCustomers, setActiveSubCustomers] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);

	// Modal States
	const [showNewSession, setShowNewSession] = useState(false);
	const [searchSession, setSearchSession] = useState("");
	const [showEditSession, setShowEditSession] = useState<Session | null>(null);
	const [showChangeDevice, setShowChangeDevice] = useState<Session | null>(
		null,
	);
	const [showAddOrder, setShowAddOrder] = useState<string | null>(null); // session_id
	const [showCheckout, setShowCheckout] = useState<Session | null>(null);
	const [showGroupCheckout, setShowGroupCheckout] = useState(false);

	const loadData = useCallback(async () => {
		try {
			const [
				{ data: sess },
				{ data: prods },
				{ data: price },
				{ data: banks },
				{ data: pkgs },
				{ data: pkgItems },
				{ data: subs },
			] = await Promise.all([
				supabase
					.from("sessions")
					.select("*")
					.order("start_time", { ascending: false }),
				supabase
					.from("products")
					.select("*")
					.eq("is_active", true)
					.order("name"),
				supabase
					.from("pricing_config")
					.select(
						"mobile_rate, laptop_rate, mobile_place_cost, laptop_place_cost, dev_percent",
					)
					.order("effective_from", { ascending: false })
					.limit(1),
				supabase.from("bank_accounts").select("id, name").eq("is_active", true),
				supabase.from("packages").select("*").eq("is_active", true),
				supabase.from("package_items").select(`*, products!inner(name)`),
				supabase.from("subscriptions").select("customer_id").eq("is_active", true),
			]);

			setSessions(sess || []);
			setProducts(prods || []);
			if (price?.[0]) setPricing(price[0]);
			setBankAccounts(banks || []);
			setPackages(pkgs || []);
			setActiveSubCustomers(new Set((subs || []).map((s: any) => s.customer_id)));
			
			const formattedPkgItems = (pkgItems || []).map((pi: any) => ({
				...pi,
				product_name: pi.products?.name,
			}));
			setPackageItems(formattedPkgItems);

			if (sess && sess.length > 0) {
				const sessionIds = sess.map((s: Session) => s.id);

				const [{ data: allOrders }, { data: allChanges }] = await Promise.all([
					supabase
						.from("session_orders")
						.select("*")
						.in("session_id", sessionIds),
					supabase
						.from("session_device_changes")
						.select("*")
						.in("session_id", sessionIds),
				]);

				const groupedOrders: Record<string, SessionOrder[]> = {};
				for (const o of allOrders || []) {
					if (!groupedOrders[o.session_id]) groupedOrders[o.session_id] = [];
					groupedOrders[o.session_id].push(o);
				}
				setOrders(groupedOrders);

				const groupedChanges: Record<string, SessionDeviceChange[]> = {};
				for (const c of allChanges || []) {
					if (!groupedChanges[c.session_id]) groupedChanges[c.session_id] = [];
					groupedChanges[c.session_id].push(c);
				}
				setDeviceChanges(groupedChanges);
			} else {
				setOrders({});
				setDeviceChanges({});
			}
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			// --- OFFLINE OPTIMISTIC MERGE ---
			try {
				const manager = getOfflineStateManager();
				const queue = manager.getQueue();
				const offlineSessions: Session[] = [];
				const deletedSessionIds = new Set<string>();
				
				for (const req of queue) {
					if (req.method === "DELETE" && req.url.includes("/rest/v1/sessions")) {
						const match = req.url.match(/id=eq\.([^&]+)/);
						if (match) deletedSessionIds.add(match[1]);
					}
					if (req.method === "POST" && req.body) {
						const parsedBody = JSON.parse(req.body);
						const items = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
						
						for (const bodyData of items) {
							if (req.url.includes("/rest/v1/sessions")) {
								if (!bodyData.id) bodyData.id = req.id; // fallback
								offlineSessions.push(bodyData);
							} else if (req.url.includes("/rest/v1/session_orders")) {
								setOrders(prev => {
									const updated = { ...prev };
									const sId = bodyData.session_id;
									if (!updated[sId]) updated[sId] = [];
									updated[sId] = [...updated[sId], bodyData];
									return updated;
								});
							} else if (req.url.includes("/rest/v1/session_device_changes")) {
								setDeviceChanges(prev => {
									const updated = { ...prev };
									const sId = bodyData.session_id;
									if (!updated[sId]) updated[sId] = [];
									updated[sId] = [...updated[sId], bodyData];
									return updated;
								});
							}
						}
					}
				}
				
				if (offlineSessions.length > 0 || deletedSessionIds.size > 0) {
					setSessions(prev => {
						const existingIds = new Set(prev.map(s => s.id));
						const newSessions = offlineSessions.filter(s => !existingIds.has(s.id));
						return [...newSessions, ...prev].filter(s => !deletedSessionIds.has(s.id));
					});
				}
			} catch (e) {
				console.error("Failed to merge offline queue:", e);
			}
			// ---------------------------------
			
			setLoading(false);
		}
	}, []);

	// Load data on mount
	useEffect(() => {
		const run = async () => {
			await loadData();
		};
		run();
	}, [loadData]);

	// استمع إلى تغييرات الأوفلاين وأعد تحميل البيانات
	useEffect(() => {
		const manager = getOfflineStateManager();
		
		const unsubscribe = manager.subscribe((event) => {
			// عند إضافة عملية إلى الطابور، أعد تحميل البيانات فوراً
			if (event.type === "queue_updated") {
				// تأخير صغير لتجنب تحديثات متعددة متتالية
				const timer = setTimeout(() => {
					loadData();
				}, 100);
				return () => clearTimeout(timer);
			}
			// عند استعادة الاتصال، أعد تحميل البيانات
			else if (event.type === "connection_restored") {
				loadData();
			}
			// عند اكتمال المزامنة، أعد تحميل البيانات
			else if (event.type === "sync_completed") {
				loadData();
			}
		});

		return () => unsubscribe();
	}, [loadData]);

	// استمع إلى حدث offline_sync_completed من OfflineSyncProvider
	useEffect(() => {
		const handleSyncCompleted = () => {
			loadData();
		};

		window.addEventListener("offline_sync_completed", handleSyncCompleted as EventListener);
		return () => {
			window.removeEventListener("offline_sync_completed", handleSyncCompleted as EventListener);
		};
	}, [loadData]);

	const handleDeleteSession = async (id: string) => {
		if (
			!confirm(
				"هل أنت متأكد من حذف هذه الجلسة بالكامل؟ سيتم مسح الطلبات المرتبطة بها دون التأثير على المخزون.",
			)
		)
			return;
		const { error } = await supabase.from("sessions").delete().eq("id", id);
		if (error) toast.error("خطأ في الحذف");
		else {
			toast.success("تم حذف الجلسة");
			loadData();
		}
	};

	const handlePauseResume = async (
		s: Session,
		toDevice: "mobile" | "laptop" | "paused",
	) => {
		const { data: changes } = await supabase
			.from("session_device_changes")
			.select("to_device")
			.eq("session_id", s.id)
			.order("changed_at", { ascending: false })
			.limit(1);
		const fromDevice =
			changes && changes.length > 0 ? changes[0].to_device : s.device;

		const { error } = await supabase.from("session_device_changes").insert({
			id: crypto.randomUUID(),
			session_id: s.id,
			from_device: fromDevice,
			to_device: toDevice,
			note: toDevice === "paused" ? "إيقاف مؤقت" : "استئناف",
		});

		if (error) {
			console.error("Pause Error:", error);
			toast.error(error.message || "حدث خطأ أثناء تغيير الحالة");
		} else {
			toast.success(
				toDevice === "paused" ? "تم إيقاف الجلسة مؤقتاً" : "تم استئناف الجلسة",
			);
			loadData();
		}
	};

	if (loading)
		return (
			<AppLayout>
				<LoadingSpinner />
			</AppLayout>
		);

	return (
		<AppLayout>
			<div className="p-7">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-xl font-bold text-[#f0f0f8] m-0">
							الجلسات النشطة
						</h1>
						<p className="text-xs text-[#6b6b8a] mt-1">
							{sessions.length} جلسة مفتوحة
						</p>
					</div>
					<div className="flex gap-2.5">
						{sessions.length >= 2 && (
							<button
								onClick={() => setShowGroupCheckout(true)}
								className="bg-indigo-400/10 border-[1.5px] border-indigo-400/30 rounded-lg text-indigo-400 py-2.5 px-4.5 text-[13px] font-semibold cursor-pointer hover:bg-indigo-400/20 transition-colors"
							>
								◈ فاتورة جماعية
							</button>
						)}
						<button
							className={btnPrimary}
							onClick={() => setShowNewSession(true)}
						>
							+ جلسة جديدة
						</button>
					</div>
				</div>

				<SearchFilterBar
					searchPlaceholder="ابحث باسم العميل..."
					searchValue={searchSession}
					onSearchChange={setSearchSession}
				/>

				{sessions.filter((s) =>
					(s.customer_name || "بدون اسم")
						.toLowerCase()
						.includes(searchSession.toLowerCase()),
				).length === 0 ? (
					<div className="text-center py-15 px-5 bg-[#111118] rounded-[14px] border border-dashed border-white/10 mt-6">
						<div className="text-[32px] mb-3">◷</div>
						<p className="text-[#4a4a6a] text-sm">لا توجد جلسات مطابقة</p>
						<button
							className={`${btnPrimary} mt-4`}
							onClick={() => setShowNewSession(true)}
						>
							ابدأ جلسة
						</button>
					</div>
				) : (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mt-6">
						{sessions
							.filter((s) =>
								(s.customer_name || "بدون اسم")
									.toLowerCase()
									.includes(searchSession.toLowerCase()),
							)
							.map((s) => (
								<SessionCard
									key={s.id}
									session={s}
									orders={orders[s.id] || []}
									deviceChanges={deviceChanges[s.id] || []}
									pricing={pricing}
									onAddOrder={(id) => setShowAddOrder(id)}
									onCheckout={(s) => setShowCheckout(s)}
									onEdit={(s) => setShowEditSession(s)}
									onDelete={handleDeleteSession}
									onChangeDevice={(s) => setShowChangeDevice(s)}
									onPauseResume={handlePauseResume}
									hasActiveSubscription={s.customer_id ? activeSubCustomers.has(s.customer_id) : false}
								/>
							))}
					</div>
				)}
			</div>

			{showNewSession && (
				<NewSessionModal
					onClose={() => setShowNewSession(false)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowNewSession(false);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showEditSession && (
				<EditSessionModal
					session={showEditSession}
					onClose={() => setShowEditSession(null)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowEditSession(null);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showChangeDevice && (
				<ChangeDeviceModal
					session={showChangeDevice}
					onClose={() => setShowChangeDevice(null)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowChangeDevice(null);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showAddOrder && (
				<AddOrderModal
					sessionId={showAddOrder}
					products={products}
					onClose={() => setShowAddOrder(null)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowAddOrder(null);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showCheckout && (
				<CheckoutModal
					session={showCheckout}
					orders={orders[showCheckout.id] || []}
					deviceChanges={deviceChanges[showCheckout.id] || []}
					pricing={pricing}
					bankAccounts={bankAccounts}
					packages={packages}
					packageItems={packageItems}
					onClose={() => setShowCheckout(null)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowCheckout(null);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}

			{showGroupCheckout && (
				<GroupCheckoutModal
					sessions={sessions}
					orders={orders}
					deviceChanges={deviceChanges}
					pricing={pricing}
					bankAccounts={bankAccounts}
					onClose={() => setShowGroupCheckout(false)}
					onSuccess={(msg) => {
						toast.success(msg);
						setShowGroupCheckout(false);
						loadData();
					}}
					onError={(msg) => toast.error(msg)}
				/>
			)}
		</AppLayout>
	);
}
