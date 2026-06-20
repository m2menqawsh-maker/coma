import type {
	Device,
	PricingConfig,
	SessionDeviceChange,
	SessionOrder,
} from "@/app/sessions/types";

export function calcCost(
	startTime: string,
	initialDevice: Device,
	mobileRate: number,
	laptopRate: number,
	changes: SessionDeviceChange[] = [],
): number {
	const start = new Date(startTime).getTime();
	const now = Date.now();

	if (!changes || changes.length === 0) {
		if (initialDevice === "paused") return 0;
		const diffMs = now - start;
		const hours = diffMs / 3600000;
		const rate = initialDevice === "mobile" ? mobileRate : laptopRate;
		return Math.round((hours * rate) * 100) / 100;
	}

	let totalCost = 0;
	let currentStart = start;
	let currentDevice = initialDevice;

	const sortedChanges = [...changes].sort(
		(a, b) =>
			new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
	);

	for (const change of sortedChanges) {
		const changeTime = new Date(change.changed_at).getTime();
		if (changeTime > currentStart && currentDevice !== "paused") {
			const hours = (changeTime - currentStart) / 3600000;
			const rate = currentDevice === "mobile" ? mobileRate : laptopRate;
			totalCost += hours * rate;
		}
		currentStart = Math.max(currentStart, changeTime);
		currentDevice = change.to_device;
	}

	if (now > currentStart && currentDevice !== "paused") {
		const hours = (now - currentStart) / 3600000;
		const rate = currentDevice === "mobile" ? mobileRate : laptopRate;
		totalCost += hours * rate;
	}

	return Math.round(totalCost * 100) / 100;
}

export function calcSessionAmount(
	startTime: string,
	initialDevice: Device,
	pricing: PricingConfig,
	changes: SessionDeviceChange[] = [],
): number {
	return calcCost(
		startTime,
		initialDevice,
		pricing.mobile_rate,
		pricing.laptop_rate,
		changes,
	);
}

export function calcPlaceCost(
	startTime: string,
	initialDevice: Device,
	pricing: PricingConfig,
	changes: SessionDeviceChange[] = [],
): number {
	return calcCost(
		startTime,
		initialDevice,
		pricing.mobile_place_cost,
		pricing.laptop_place_cost,
		changes,
	);
}

export function calcOrdersTotal(orders: SessionOrder[]): number {
	return orders.reduce((sum, o) => sum + o.price_per_unit * o.quantity, 0);
}
