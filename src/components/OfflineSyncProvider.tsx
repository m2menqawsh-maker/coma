"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { evictOldCache, evictTableCache } from "@/lib/supabase/cache.utils";
import { createClient } from "@/lib/supabase/client";
import { getOfflineStateManager, type OfflineStatus } from "@/lib/offline/offlineStateManager";

type SyncStatus = "online" | "offline" | "syncing";

interface OfflineSyncContextType {
	status: SyncStatus;
	pendingCount: number;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
	status: "online",
	pendingCount: 0,
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const manager = getOfflineStateManager();
	const [status, setStatus] = useState<SyncStatus>("online");
	const [pendingCount, setPendingCount] = useState(0);

	// تحديث الحالة من manager
	useEffect(() => {
		const unsubscribe = manager.subscribe((event) => {
			if (event.type === "status_changed") {
				const managerStatus = event.data.status;
				// تحويل حالة manager إلى SyncStatus
				if (managerStatus === "syncing") {
					setStatus("syncing");
				} else if (managerStatus === "offline") {
					setStatus("offline");
				} else {
					setStatus("online");
				}
			} else if (event.type === "queue_updated") {
				setPendingCount(event.data.queueLength);
			}
		});

		return () => unsubscribe();
	}, [manager]);

	// Initialize status and clean up old cache on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			setStatus(manager.getStatus() === "offline" ? "offline" : "online");
			setPendingCount(manager.getPendingCount());
			evictOldCache(); // Use the unified cache eviction logic

			// Suppress Supabase Auth AbortErrors in dev mode
			const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
				if (
					event.reason?.name === "AbortError" &&
					event.reason?.message?.includes("steal")
				) {
					event.preventDefault();
					console.warn("Supabase Lock AbortError suppressed.");
				}
			};
			window.addEventListener("unhandledrejection", handleUnhandledRejection);
			return () => {
				window.removeEventListener(
					"unhandledrejection",
					handleUnhandledRejection,
				);
			};
		}
	}, [manager]);

	// Pre-fetch all customers for offline search
	useEffect(() => {
		if (typeof window === "undefined") return;

		const fetchAllCustomers = async () => {
			if (!manager.isOnline()) return;
			try {
				// Only fetch if cache is empty to save massive payload loading
				const cached = localStorage.getItem("all_customers_cache");
				if (cached && cached.length > 100) return;

				const supabase = createClient();
				const { data } = await supabase
					.from("customers")
					.select("id, name, phone, balance, is_vip, last_visit_at")
					.order("last_visit_at", { ascending: false })
					.limit(2000);
				if (data) {
					localStorage.setItem("all_customers_cache", JSON.stringify(data));
				}
			} catch (e) {
				console.error("Failed to pre-fetch customers", e);
			}
		};

		// Defer the execution to not block the main dashboard load
		const timer = setTimeout(() => {
			fetchAllCustomers();
		}, 5000);

		window.addEventListener("online", fetchAllCustomers);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("online", fetchAllCustomers);
		};
	}, [manager]);

	const syncQueue = useCallback(async () => {
		try {
			const queue = manager.getQueue();
			if (queue.length === 0) return;

			manager.setSyncingStatus(true);
			setStatus("syncing");

			let syncedItems = 0;
			const affectedTables = new Set<string>();

			for (let i = 0; i < queue.length; i++) {
				const req = queue[i];
				try {
					const supabase = createClient();
					const { data } = await supabase.auth.getSession();

					if (data?.session?.access_token) {
						req.headers = req.headers || {};

						const keys = Object.keys(req.headers);
						for (const k of keys) {
							const lower = k.toLowerCase();
							if (
								["authorization", "apikey", "content-type", "prefer"].includes(
									lower,
								)
							) {
								delete req.headers[k];
							}
						}

						req.headers.Authorization = `Bearer ${data.session.access_token}`;
						req.headers.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
						req.headers["Content-Type"] = "application/json";
						req.headers.Prefer = "return=representation";
					}

					const response = await fetch(req.url, {
						method: req.method,
						headers: req.headers,
						body: req.body,
					});

					if (response.ok) {
						manager.removeFromQueue(i - syncedItems); // Adjust index after removals
						syncedItems++;
						const tableNameMatch = req.url.match(/\/rest\/v1\/([^?]+)/);
						if (tableNameMatch) {
							affectedTables.add(tableNameMatch[1]);
						}
					} else {
						const errText = await response.text();
						if (
							response.status === 409 ||
							errText.includes("23505") ||
							errText.includes("already exists")
						) {
							manager.removeFromQueue(i - syncedItems);
							syncedItems++;
							const tableNameMatch = req.url.match(/\/rest\/v1\/([^?]+)/);
							if (tableNameMatch) {
								affectedTables.add(tableNameMatch[1]);
							}
							continue;
						}

						console.error("Failed to sync offline request", req, errText);
						if (response.status >= 400 && response.status < 500) {
							console.warn(
								`Dropping invalid request (status ${response.status}) from queue`,
							);
							manager.removeFromQueue(i - syncedItems);
							syncedItems++;
							const tableNameMatch = req.url.match(/\/rest\/v1\/([^?]+)/);
							if (tableNameMatch) {
								affectedTables.add(tableNameMatch[1]);
							}
							continue;
						}
						break;
					}
				} catch (err: unknown) {
					console.warn(
						"Network error during sync (internet might be down):",
						(err as Error)?.message || err,
					);
					break;
				}
			}

			manager.setSyncingStatus(false);
			setStatus("online");

			if (syncedItems > 0) {
				// Dispatch a custom event to notify client.ts to update its cache
				window.dispatchEvent(
					new CustomEvent("offline_sync_completed", {
						detail: { affectedTables: Array.from(affectedTables) },
					}),
				);
				// Refresh the router after the cache has been evicted
				router.refresh();
			}
		} catch (e) {
			console.error("Error during syncQueue", e);
			manager.setSyncingStatus(false);
			setStatus("online");
		}
	}, [manager, router]);

	useEffect(() => {
		const handleOnline = () => {
			setStatus("online");
			syncQueue();
		};

		const handleOffline = () => {
			setStatus("offline");
		};

		// Listen for custom event from OfflineSyncProvider to trigger cache eviction
		const handleOfflineSyncCompleted = (event: CustomEvent) => {
			const { affectedTables } = event.detail;
			affectedTables.forEach((tableName: string) => {
				evictTableCache(tableName);
			});
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible" && navigator.onLine) {
				if (manager.getStatus() === "offline") {
					handleOnline();
				}
			}
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		window.addEventListener("supabase_online", handleOnline);
		window.addEventListener("supabase_offline", handleOffline);
		window.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener(
			"offline_sync_completed",
			handleOfflineSyncCompleted as EventListener,
		);

		if (manager.isOnline()) {
			syncQueue();
		}

		// محاولة المزامنة كل 10 ثوانٍ بدلاً من الاعتماد على أحداث الشبكة فقط
		const interval = setInterval(() => {
			if (manager.isOnline() && manager.getPendingCount() > 0) {
				syncQueue();
			}
		}, 10000);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("supabase_online", handleOnline);
			window.removeEventListener("supabase_offline", handleOffline);
			window.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener(
				"offline_sync_completed",
				handleOfflineSyncCompleted as EventListener,
			);
			clearInterval(interval);
		};
	}, [syncQueue, manager]);

	return (
		<OfflineSyncContext.Provider value={{ status, pendingCount }}>
			{children}
			{(status !== "online" || pendingCount > 0) && (
				<div
					className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] text-white px-4 py-2 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2 transition-colors duration-300 ${
						status === "offline"
							? "bg-red-500"
							: status === "syncing"
								? "bg-yellow-500"
								: "bg-blue-500"
					}`}
				>
					{status === "offline"
						? "📡 غير متصل (أوفلاين)"
						: status === "syncing"
							? "⏳ جاري المزامنة..."
							: "📶 متصل"}
					{pendingCount > 0 && (
						<span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
							{pendingCount} تغييرات
						</span>
					)}
				</div>
			)}
		</OfflineSyncContext.Provider>
	);
}
