import { shouldCacheForever } from "./client"; // Assuming shouldCacheForever is still needed from client.ts

const SUPABASE_CACHE_PREFIX = "supabase_cache_";

interface CacheEntry {
	date: "permanent" | string; // 'permanent' for forever cache, or a date string for temporary
	data: string;
}

// Helper to extract table name from URL
function getTableNameFromUrl(urlStr: string): string | null {
	const match = urlStr.match(/\/rest\/v1\/([^?]+)/);
	return match ? match[1] : null;
}

// Helper to generate a consistent hash for query parameters
function getQueryParamsHash(urlStr: string): string {
	try {
		const url = new URL(urlStr);
		const params = Array.from(url.searchParams.entries())
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([key, value]) => `${key}=${value}`)
			.join("&");

		// Use a simple hash to keep keys short and safe
		if (!params) return "no_params";
		let hash = 0;
		for (let i = 0; i < params.length; i++) {
			hash = (hash << 5) - hash + params.charCodeAt(i);
			hash |= 0;
		}
		return hash.toString();
	} catch (_e) {
		return "invalid_url";
	}
}

// Save data to the cache
export function saveDataToCache(
	urlStr: string,
	data: string,
	isPermanent: boolean = false,
) {
	const tableName = getTableNameFromUrl(urlStr);
	if (!tableName || !shouldCacheForever(urlStr)) return; // Only cache allowed tables

	const queryHash = getQueryParamsHash(urlStr);
	const cacheKey = `${SUPABASE_CACHE_PREFIX}${tableName}_${queryHash}`;

	// Defer heavy JSON.stringify and localStorage write to avoid blocking UI thread
	setTimeout(() => {
		try {
			const entry: CacheEntry = {
				date: isPermanent ? "permanent" : new Date().toISOString(),
				data,
			};

			try {
				localStorage.setItem(cacheKey, JSON.stringify(entry));
			} catch (_e) {
				// Fallback: evict old cache if quota exceeded
				evictOldCache();
				try {
					localStorage.setItem(cacheKey, JSON.stringify(entry));
				} catch (e2) {
					console.error("Failed to save data to cache after eviction:", e2);
				}
			}
		} catch (e) {
			console.error("Failed to stringify cache entry:", e);
		}
	}, 10);
}

// Read data from the cache
export function readDataFromCache(urlStr: string): unknown | null {
	const tableName = getTableNameFromUrl(urlStr);
	if (!tableName || !shouldCacheForever(urlStr)) return null;

	const queryHash = getQueryParamsHash(urlStr);
	const cacheKey = `${SUPABASE_CACHE_PREFIX}${tableName}_${queryHash}`;

	try {
		const entryStr = localStorage.getItem(cacheKey);
		if (!entryStr) return null;

		const entry: CacheEntry = JSON.parse(entryStr);

		if (entry && typeof entry === "object" && entry.data) {
			return JSON.parse(entry.data);
		}
		return null;
	} catch (e) {
		console.error("Failed to read data from cache:", e);
		return null;
	}
}

// Evict old cache entries (not 'permanent')
export function evictOldCache() {
	try {
		const now = new Date();
		const keysToDelete: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k?.startsWith(SUPABASE_CACHE_PREFIX)) {
				try {
					const entryStr = localStorage.getItem(k);
					if (!entryStr) continue;

					const entry = JSON.parse(entryStr);

					// If it's the old table-based format (not CacheEntry), we should delete it
					if (
						!entry ||
						typeof entry !== "object" ||
						(!entry.date && !entry.data)
					) {
						keysToDelete.push(k);
						continue;
					}

					if (entry.date !== "permanent") {
						const entryDate = new Date(entry.date);
						if (
							(now.getTime() - entryDate.getTime()) / (1000 * 60 * 60) >=
							24
						) {
							keysToDelete.push(k);
						}
					}
				} catch (e) {
					console.error("Error processing cache key for eviction:", k, e);
					keysToDelete.push(k);
				}
			}
		}
		keysToDelete.forEach((k) => localStorage.removeItem(k));
	} catch (e) {
		console.error("Error during cache eviction:", e);
	}
}

// Evict cache for a specific table (e.g., after a mutation)
export function evictTableCache(tableName: string) {
	try {
		const prefix = `${SUPABASE_CACHE_PREFIX}${tableName}_`;
		const keysToDelete: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (
				k &&
				(k.startsWith(prefix) || k === `${SUPABASE_CACHE_PREFIX}${tableName}`)
			) {
				keysToDelete.push(k);
			}
		}

		keysToDelete.forEach((k) => localStorage.removeItem(k));
	} catch (e) {
		console.error(`Failed to evict cache for table ${tableName}:`, e);
	}
}

// Evict all cache (e.g., on logout)
export function evictAllCache() {
	try {
		const keysToDelete: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k?.startsWith(SUPABASE_CACHE_PREFIX)) {
				keysToDelete.push(k);
			}
		}
		keysToDelete.forEach((k) => localStorage.removeItem(k));
	} catch (e) {
		console.error("Failed to evict all cache:", e);
	}
}
