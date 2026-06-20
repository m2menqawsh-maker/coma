export interface InvoiceTotalsInput {
	sessionAmount: number;
	ordersTotal: number;
	discount: number;
	creditApplied: number;
	subscriptionApplied?: number;
	totalPaid: number;
	totalCost: number; // For example: placeCost + order items cost
}

export interface InvoiceTotalsResult {
	totalAmount: number; // sessionAmount + ordersTotal
	baseTotal: number; // totalAmount - discount
	totalDue: number; // baseTotal - creditApplied - subscriptionApplied
	overpaidRaw: number; // max(0, totalPaid - totalDue)
	debtCreated: number; // max(0, totalDue - totalPaid)
	grossProfit: number; // baseTotal - totalCost
}

export function calculateInvoiceTotals(
	input: InvoiceTotalsInput,
): InvoiceTotalsResult {
	const {
		sessionAmount,
		ordersTotal,
		discount,
		creditApplied,
		subscriptionApplied = 0,
		totalPaid,
		totalCost,
	} = input;

	const totalAmount = sessionAmount + ordersTotal;
	const exactBaseTotal = Math.max(0, totalAmount - discount);
	const exactDue = Math.max(0, exactBaseTotal - creditApplied - subscriptionApplied);

	// Round the final amount due to nearest integer
	const totalDue = Math.round(exactDue);
	const roundingDiff = exactDue - totalDue;
	
	// Adjust baseTotal based on rounding, so gross profit reflects the real amount charged
	const baseTotal = exactBaseTotal - roundingDiff;

	const overpaidRaw = Math.max(0, totalPaid - totalDue);
	const debtCreated = Math.max(0, totalDue - totalPaid);

	const grossProfit = baseTotal - totalCost;

	return {
		totalAmount,
		baseTotal,
		totalDue,
		overpaidRaw,
		debtCreated,
		grossProfit,
	};
}
