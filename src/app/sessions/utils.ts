import type {
	Device,
	PricingConfig,
	Session,
	SessionDeviceChange,
	SessionOrder,
	Package,
	PackageItem,
} from "./types";

export interface HistorySegment {
	device: Device;
	minutes: number;
}

export function formatDuration(
	startTime: string,
	initialDevice: Device = "mobile",
	changes: SessionDeviceChange[] = [],
): string {
	let activeMs = 0;
	const start = new Date(startTime).getTime();
	const now = Date.now();

	if (!changes || changes.length === 0) {
		if (initialDevice !== "paused") activeMs = now - start;
	} else {
		let currentStart = start;
		let currentDev = initialDevice;
		const sorted = [...changes].sort(
			(a, b) =>
				new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
		);

		for (const c of sorted) {
			const cTime = new Date(c.changed_at).getTime();
			if (cTime > currentStart && currentDev !== "paused") {
				activeMs += cTime - currentStart;
			}
			currentStart = Math.max(currentStart, cTime);
			currentDev = c.to_device;
		}
		if (now > currentStart && currentDev !== "paused") {
			activeMs += now - currentStart;
		}
	}

	const totalMinutes = Math.floor(activeMs / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return hours > 0 ? `${hours}س ${minutes}د` : `${minutes}د`;
}

export function calcSessionHours(
	startTime: string,
	initialDevice: Device,
	changes: SessionDeviceChange[] = [],
): number {
	const start = new Date(startTime).getTime();
	const now = Date.now();

	if (!changes || changes.length === 0) {
		if (initialDevice === "paused") return 0;
		const diffMs = now - start;
		return diffMs / 3600000;
	}

	let totalHours = 0;
	let currentStart = start;
	let currentDevice = initialDevice;

	const sortedChanges = [...changes].sort(
		(a, b) =>
			new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
	);

	for (const change of sortedChanges) {
		const changeTime = new Date(change.changed_at).getTime();
		if (changeTime > currentStart && currentDevice !== "paused") {
			totalHours += (changeTime - currentStart) / 3600000;
		}
		currentStart = Math.max(currentStart, changeTime);
		currentDevice = change.to_device;
	}

	if (now > currentStart && currentDevice !== "paused") {
		totalHours += (now - currentStart) / 3600000;
	}

	return totalHours;
}

export function getInitialDevice(
	session: Session,
	changes: SessionDeviceChange[] = [],
): Device {
	if (changes && changes.length > 0) {
		const sorted = [...changes].sort(
			(a, b) =>
				new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
		);
		return sorted[0].from_device;
	}
	return session.device;
}

export function getCurrentDevice(
	session: Session,
	changes: SessionDeviceChange[] = [],
): Device {
	if (changes && changes.length > 0) {
		const sorted = [...changes].sort(
			(a, b) =>
				new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
		);
		return sorted[0].to_device;
	}
	return session.device;
}
import {
	calcCost,
	calcOrdersTotal,
	calcPlaceCost,
	calcSessionAmount,
} from "@/lib/finance/sessions";

export {
	calcCost,
	calcOrdersTotal,
	calcPlaceCost,
	calcSessionAmount,
};

export function applyPackageToSession(
	session: Session,
	initialDev: Device,
	deviceChanges: SessionDeviceChange[],
	pricing: PricingConfig,
	orders: SessionOrder[],
	selectedPackage: Package | undefined,
	packageItems: PackageItem[],
	extraHoursMethod: "normal" | "proportional" | "free"
) {
	let packageAmount = 0;
	let extraSessionAmount = 0;
	let extraOrdersTotal = calcOrdersTotal(orders);
	let extraHours = 0;
	let sessionAmount = calcSessionAmount(session.start_time, initialDev, pricing, deviceChanges);

	if (selectedPackage) {
		packageAmount = selectedPackage.price;
		
		const pkgItemsForThis = packageItems.filter(pi => pi.package_id === selectedPackage.id);
		const remainingOrders = orders.map(o => ({ ...o }));

		for (const pi of pkgItemsForThis) {
			let qtyToCover = pi.quantity;
			for (const order of remainingOrders) {
				if (order.product_id === pi.product_id && (pi.size ? order.size === pi.size : true) && qtyToCover > 0) {
					const covered = Math.min(order.quantity, qtyToCover);
					qtyToCover -= covered;
					order.quantity -= covered;
				}
			}
		}
		
		extraOrdersTotal = calcOrdersTotal(remainingOrders);

		const totalHours = calcSessionHours(session.start_time, initialDev, deviceChanges);
		extraHours = Math.max(0, totalHours - selectedPackage.hours);
		
		if (extraHours > 0) {
			if (extraHoursMethod === "normal") {
				const rate = initialDev === "mobile" ? pricing.mobile_rate : pricing.laptop_rate;
				extraSessionAmount = Math.round((extraHours * rate) * 100) / 100;
			} else if (extraHoursMethod === "proportional") {
				const packageHourlyRate = (selectedPackage.hours && selectedPackage.hours > 0) ? (selectedPackage.price / selectedPackage.hours) : 0;
				extraSessionAmount = Math.round((extraHours * packageHourlyRate) * 100) / 100;
			} else if (extraHoursMethod === "free") {
				extraSessionAmount = 0;
			}
		}
		
		sessionAmount = packageAmount + extraSessionAmount;
	}

	return {
		sessionAmount,
		ordersTotal: selectedPackage ? extraOrdersTotal : calcOrdersTotal(orders),
		packageAmount,
		extraSessionAmount,
		extraOrdersTotal,
		extraHours
	};
}

export function getDeviceHistorySegments(
	session: Session,
	changes: SessionDeviceChange[] = [],
): HistorySegment[] {
	if (!changes || changes.length === 0) return [];
	const sorted = [...changes].sort(
		(a, b) =>
			new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
	);
	const segments: HistorySegment[] = [];

	let start = new Date(session.start_time).getTime();
	let currentDev = sorted[0].from_device;

	sorted.forEach((c) => {
		const end = new Date(c.changed_at).getTime();
		const diff = end - start;
		const mins = Math.floor(diff / 60000);
		segments.push({ device: currentDev, minutes: mins });
		start = end;
		currentDev = c.to_device;
	});
	const finalDiff = Date.now() - start;
	const finalMins = Math.floor(finalDiff / 60000);
	segments.push({ device: currentDev, minutes: finalMins });

	return segments;
}

export function formatDeviceHistory(
	session: Session,
	changes: SessionDeviceChange[] = [],
): string {
	const segments = getDeviceHistorySegments(session, changes);
	if (segments.length === 0) return "";
	const devName = (d: Device) =>
		d === "mobile" ? "موبايل" : d === "laptop" ? "لابتوب" : "متوقف";
	return segments
		.map((s) => `${devName(s.device)} (${s.minutes}د)`)
		.join(" -> ");
}

export const DEFAULT_PRICING: PricingConfig = {
	mobile_rate: 3,
	laptop_rate: 5,
	mobile_place_cost: 0.5,
	laptop_place_cost: 1,
	dev_percent: 0,
};

export const inputStyle =
	"w-full bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] rounded-lg py-2.5 px-3.5 text-[13px] text-[#e8e8f5] outline-none h-[42px] focus:border-indigo-500/50 transition-colors";

export const btnPrimary =
	"bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] border-none rounded-lg text-white py-2.5 px-4 text-[13px] font-semibold cursor-pointer h-[42px] whitespace-nowrap hover:opacity-90 transition-opacity";

export const btnSecondary =
	"bg-white/5 border border-white/10 rounded-lg text-[#9090b0] py-2.5 px-4 text-[13px] cursor-pointer h-[42px] whitespace-nowrap hover:bg-white/10 transition-colors";

export const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);
