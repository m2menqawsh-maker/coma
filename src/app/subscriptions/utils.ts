import type { Subscription, SubscriptionUsage } from "./types";
import type { SessionOrder, SessionDeviceChange, Device, PricingConfig } from "../sessions/types";
import { calcSessionHours, calcOrdersTotal, calcSessionAmount } from "../sessions/utils";

/**
 * Checks if the current day is within the subscription date range and not excluded.
 */
export function isSubscriptionActiveForDay(subscription: Subscription, dateStr: string): boolean {
	if (!subscription.is_active) return false;
	
	const d = new Date(dateStr);
	const start = new Date(subscription.start_date);
	const end = new Date(subscription.end_date);
	
	// Reset time for comparison
	d.setHours(0,0,0,0);
	start.setHours(0,0,0,0);
	end.setHours(0,0,0,0);
	
	if (d < start || d > end) return false;
	
	const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ...
	if (subscription.excluded_days && subscription.excluded_days.includes(dayOfWeek)) {
		return false;
	}
	
	return true;
}

/**
 * Calculates remaining hours and drinks for a subscription before this session.
 */
export function calculateSubscriptionBalance(
	subscription: Subscription,
	usages: SubscriptionUsage[],
	currentDateStr: string
) {
	let remainingHours = 0;
	let remainingDrinks = 0;
	
	if (subscription.type === "days" && subscription.limit_value) {
		const todayUsages = usages.filter(u => u.date === currentDateStr);
		const usedHoursToday = todayUsages.reduce((sum, u) => sum + u.hours_used, 0);
		remainingHours = Math.max(0, subscription.limit_value - usedHoursToday);
	} else if (subscription.type === "hours" && subscription.limit_value) {
		const usedHoursTotal = usages.reduce((sum, u) => sum + u.hours_used, 0);
		remainingHours = Math.max(0, subscription.limit_value - usedHoursTotal);
	}
	
	if (subscription.drinks_allowance) {
		if (subscription.drinks_allowance.type === "daily") {
			const todayUsages = usages.filter(u => u.date === currentDateStr);
			const usedDrinksToday = todayUsages.reduce((sum, u) => sum + u.drinks_used, 0);
			remainingDrinks = Math.max(0, subscription.drinks_allowance.count - usedDrinksToday);
		} else if (subscription.drinks_allowance.type === "total") {
			const usedDrinksTotal = usages.reduce((sum, u) => sum + u.drinks_used, 0);
			remainingDrinks = Math.max(0, subscription.drinks_allowance.count - usedDrinksTotal);
		}
	}
	
	return { remainingHours, remainingDrinks };
}

export function applySubscriptionToSession(
	sessionStartTime: string,
	initialDev: Device,
	deviceChanges: SessionDeviceChange[],
	pricing: PricingConfig,
	orders: SessionOrder[],
	subscription: Subscription,
	usages: SubscriptionUsage[] // Usages EXCLUDING the current session being checked out
) {
	const currentSessionDate = new Date(sessionStartTime).toISOString().split('T')[0];
	
	const isDeviceMismatch = subscription.device && subscription.device !== initialDev;

	if (!isSubscriptionActiveForDay(subscription, currentSessionDate) || isDeviceMismatch) {
		return {
			sessionAmount: calcSessionAmount(sessionStartTime, initialDev, pricing, deviceChanges),
			ordersTotal: calcOrdersTotal(orders),
			subscriptionDiscountAmount: 0,
			subscriptionApplied: 0,
			extraSessionAmount: 0,
			extraOrdersTotal: 0,
			hoursCovered: 0,
			drinksCovered: 0,
			extraHours: 0,
			coveredOrderDetails: [] as { product_id: string; quantity: number }[]
		};
	}
	
	const { remainingHours, remainingDrinks } = calculateSubscriptionBalance(subscription, usages, currentSessionDate);
	
	let totalHours = calcSessionHours(sessionStartTime, initialDev, deviceChanges);
	let extraHours = 0;
	let hoursCovered = 0;
	let extraSessionAmount = 0;
	
	if (remainingHours >= totalHours) {
		hoursCovered = totalHours;
		extraHours = 0;
		extraSessionAmount = 0;
	} else {
		hoursCovered = remainingHours;
		extraHours = totalHours - remainingHours;
		// Calculate the cost of the extra hours at normal rate
		const currentRate = initialDev === "mobile" ? pricing.mobile_rate : pricing.laptop_rate;
		extraSessionAmount = extraHours * currentRate; // Note: if device changed, this is a simplification. Usually we just apply normal rate to extra hours based on initial or average rate. We'll use the initial device rate for extra hours.
	}
	
	let extraOrdersTotal = 0;
	let drinksCovered = 0;
	const coveredOrderDetails: { product_id: string; quantity: number }[] = [];
	
	const remainingOrders = orders.map(o => ({ ...o }));
	const allowedProducts = subscription.drinks_allowance?.allowed_products;
	
	let drinksToCover = remainingDrinks;
	
	let deferredDrinksRevenue = 0;
	
	for (const order of remainingOrders) {
		const isProductAllowed = allowedProducts === "all" || (Array.isArray(allowedProducts) && allowedProducts.includes(order.product_id));
		
		if (isProductAllowed && drinksToCover > 0) {
			const covered = Math.min(order.quantity, drinksToCover);
			drinksToCover -= covered;
			order.quantity -= covered;
			drinksCovered += covered;
			
			if (covered > 0) {
				deferredDrinksRevenue += covered * order.price_per_unit;
				coveredOrderDetails.push({ product_id: order.product_id, quantity: covered });
			}
		}
	}
	
	extraOrdersTotal = calcOrdersTotal(remainingOrders);
	
	const hourlyRate = (subscription.limit_value && subscription.limit_value > 0) 
		? (subscription.price / subscription.limit_value) 
		: 0;
		
	// التقريب المالي لمنع مشاكل الأرقام العشرية الطويلة (مثل 33.3333)
	const deferredHoursRevenue = Math.round((hoursCovered * hourlyRate) * 100) / 100;
	const subscriptionApplied = Math.round((deferredHoursRevenue + deferredDrinksRevenue) * 100) / 100;
	
	return {
		sessionAmount: deferredHoursRevenue + extraSessionAmount,
		ordersTotal: deferredDrinksRevenue + extraOrdersTotal,
		subscriptionDiscountAmount: 0, // No longer used as a discount, replaced by deferred revenue
		subscriptionApplied,
		extraSessionAmount,
		extraOrdersTotal,
		hoursCovered,
		drinksCovered,
		extraHours,
		coveredOrderDetails
	};
}
