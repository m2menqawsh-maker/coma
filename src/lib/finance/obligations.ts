export type ScheduleType = "monthly" | "weekly" | "daily";

export const DAYS_IN_PERIOD: Record<ScheduleType, number> = {
	monthly: 30,
	weekly: 7,
	daily: 1,
};

export function calcObligationDailyRate(
	amount: number,
	scheduleType: ScheduleType,
): number {
	return amount / DAYS_IN_PERIOD[scheduleType];
}

export function calcObligationTotalDue(
	dailyRate: number,
	days: number,
): number {
	return Math.round(dailyRate * days * 100) / 100;
}
