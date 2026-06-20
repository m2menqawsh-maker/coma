import { createBrowserClient } from "@supabase/ssr";
import {
	evictTableCache,
	readDataFromCache,
	saveDataToCache,
} from "./cache.utils";

// This function should remain here to determine which URLs are eligible for caching
export function shouldCacheForever(urlStr: string): boolean {
	return (
		urlStr.includes("/rest/v1/sessions") ||
		urlStr.includes("/rest/v1/session_orders") ||
		urlStr.includes("/rest/v1/customers") ||
		urlStr.includes("/rest/v1/session_device_changes") ||
		urlStr.includes("/rest/v1/pricing_config") ||
		urlStr.includes("/rest/v1/inventory_items") ||
		urlStr.includes("/rest/v1/products") ||
		urlStr.includes("/rest/v1/bank_accounts") ||
		urlStr.includes("/rest/v1/packages") ||
		urlStr.includes("/rest/v1/package_items") ||
		urlStr.includes("/rest/v1/subscriptions")
	); // Often needed for checkout
}

// Helper to extract table name from URL (duplicated for client.ts self-sufficiency, but cache.utils.ts has its own)
function getTableNameFromUrl(urlStr: string): string | null {
	const match = urlStr.match(/\/rest\/v1\/([^?]+)/);
	return match ? match[1] : null;
}

let browserClient: any = null;

export function createClient() {
	if (typeof window !== "undefined" && browserClient) {
		return browserClient;
	}

	const client = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			global: {
				fetch: async (url, options) => {
					const isBrowser = typeof window !== "undefined";
					const method = (options?.method || "GET").toUpperCase();
					const urlStr = url.toString();

					if (isBrowser && urlStr.includes("/rest/v1/")) {
						const isOffline = (isBrowser && !navigator.onLine) || (isBrowser && (window as any).forceOfflineMode);

						const handleOfflineMutation = () => {
							const requestBody = options?.body;

							const plainHeaders: Record<string, string> = {};
							if (options?.headers) {
								if (options.headers instanceof Headers) {
									options.headers.forEach((value, key) => {
										plainHeaders[key] = value;
									});
								} else if (Array.isArray(options.headers)) {
									options.headers.forEach(([key, value]) => {
										plainHeaders[key] = value;
									});
								} else {
									Object.assign(plainHeaders, options.headers);
								}
							}

							try {
								const queueStr =
									localStorage.getItem("supabase_offline_queue") || "[]";
								const queue = JSON.parse(queueStr);

								queue.push({
									id: crypto.randomUUID(), // Use native crypto for UUID
									url: url.toString(),
									method: method,
									headers: plainHeaders,
									body: requestBody,
									timestamp: Date.now(),
								});
								localStorage.setItem(
									"supabase_offline_queue",
									JSON.stringify(queue),
								);
								window.dispatchEvent(new Event("offline_queue_updated"));
							} catch (err) {
								console.error("Failed to queue offline request", err);
							}

							// For offline mutations, we return a generic success response.
							// The actual data manipulation will happen when the queue syncs.
							if (isBrowser) {
								window.dispatchEvent(new Event("supabase_offline"));
								(window as any).forceOfflineMode = true;
								setTimeout(() => { (window as any).forceOfflineMode = false; }, 10000);
							}
							return new Response(
								JSON.stringify({ message: "Queued for offline sync" }),
								{
									status: 202, // Accepted for processing
									statusText: "Offline Queued",
									headers: { "Content-Type": "application/json" },
								},
							);
						};

						const handleOfflineGet = () => {
							const cachedData = readDataFromCache(urlStr);
							if (cachedData !== null) {
								return new Response(JSON.stringify(cachedData), {
									status: 200,
									headers: { "Content-Type": "application/json" },
								});
							}
							
							// If we must cache this table forever, gracefully degrade to empty array instead of crashing
							if (shouldCacheForever(urlStr)) {
								return new Response(JSON.stringify([]), {
									status: 200,
									headers: { "Content-Type": "application/json" },
								});
							}
							
							// If no cache, throw the error so Supabase registers it as an error
							throw new Error("Offline and no cache available");
						};

						// Process based on method
						if (["POST", "PATCH", "DELETE"].includes(method)) {
							if (isOffline) {
								return handleOfflineMutation();
							} else {
								try {
									const controller = new AbortController();
									const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
									const fetchOptions = {
										...options,
										signal: controller.signal,
									};

									const res = await fetch(url, fetchOptions);
									clearTimeout(timeoutId);

									if (res.ok) {
										if (isBrowser) {
											(window as any).forceOfflineMode = false;
											window.dispatchEvent(new Event("supabase_online"));
										}
										// Evict cache for the affected table after a successful mutation
										const tableName = getTableNameFromUrl(urlStr);
										if (tableName) {
											evictTableCache(tableName);
										}
									}
									return res;
								} catch (e) {
									console.warn(
										"Network error during mutation, queueing offline:",
										e,
									);
									if (isBrowser) {
										(window as any).forceOfflineMode = true;
										setTimeout(() => { (window as any).forceOfflineMode = false; }, 10000);
										window.dispatchEvent(new Event("supabase_offline"));
									}
									return handleOfflineMutation();
								}
							}
						} else if (method === "GET") {
							if (isOffline) {
								return handleOfflineGet();
							} else {
								try {
									const controller = new AbortController();
									const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
									const fetchOptions = {
										...options,
										signal: controller.signal,
									};

									const res = await fetch(url, fetchOptions);
									clearTimeout(timeoutId);

									if (res.ok) {
										if (isBrowser) {
											(window as any).forceOfflineMode = false;
											window.dispatchEvent(new Event("supabase_online"));
										}
										const clone = res.clone();
										clone
											.text()
											.then((text) => {
												saveDataToCache(
													urlStr,
													text,
													shouldCacheForever(urlStr),
												);
											})
											.catch(() => {});
									}
									return res;
								} catch (e) {
									console.warn(
										"Network error during GET, serving from cache:",
										e,
									);
									if (isBrowser) {
										(window as any).forceOfflineMode = true;
										setTimeout(() => { (window as any).forceOfflineMode = false; }, 10000);
										window.dispatchEvent(new Event("supabase_offline"));
									}
									return handleOfflineGet();
								}
							}
						}
					}

					try {
						return await fetch(url, options);
					} catch (err) {
						if (isBrowser) {
							return new Response(
								JSON.stringify({
									error: "offline",
									message: "No internet connection",
								}),
								{
									status: 503,
									statusText: "Service Unavailable",
									headers: { "Content-Type": "application/json" },
								},
							);
						}
						throw err;
					}
				},
			},
		},
	);

	if (typeof window !== "undefined") {
		browserClient = client;
	}

	return client;
}
