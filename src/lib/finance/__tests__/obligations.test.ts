import { describe, expect, it } from "vitest";
import {
	calcObligationDailyRate,
	calcObligationTotalDue,
} from "../obligations";

describe("finance obligations logic", () => {
	it("calculates daily rate correctly for monthly", () => {
		expect(calcObligationDailyRate(3000, "monthly")).toBe(100);
	});

	it("calculates daily rate correctly for weekly", () => {
		expect(calcObligationDailyRate(700, "weekly")).toBe(100);
	});

	it("calculates daily rate correctly for daily", () => {
		expect(calcObligationDailyRate(50, "daily")).toBe(50);
	});

	it("calculates total due with rounding", () => {
		// dailyRate = 100/3 = 33.333...
		// 33.333... * 5 days = 166.666...
		// should round to 166.67
		expect(calcObligationTotalDue(100 / 3, 5)).toBe(166.67);
	});
});
