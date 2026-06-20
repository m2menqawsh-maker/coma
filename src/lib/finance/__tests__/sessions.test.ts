import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionDeviceChange, SessionOrder } from "@/app/sessions/types";
import { calcCost, calcOrdersTotal } from "../sessions";

describe("finance sessions logic", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("calculates cost without changes correctly", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();
		vi.setSystemTime(new Date("2023-01-01T12:00:00Z")); // 2 hours later

		// mobile
		expect(calcCost(startTime, "mobile", 3, 5)).toBe(6); // 2 * 3

		// laptop
		expect(calcCost(startTime, "laptop", 3, 5)).toBe(10); // 2 * 5
	});

	it("calculates cost with paused initial device", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();
		vi.setSystemTime(new Date("2023-01-01T12:00:00Z")); // 2 hours later

		expect(calcCost(startTime, "paused", 3, 5)).toBe(0);
	});

	it("calculates cost with device changes (mobile -> laptop)", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();

		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "laptop",
				changed_at: new Date("2023-01-01T11:00:00Z").toISOString(),
			},
		];

		vi.setSystemTime(new Date("2023-01-01T12:30:00Z")); // 1.5 hr laptop (total 2.5 hrs)

		// 1 hr mobile @ 3 = 3
		// 1.5 hr laptop @ 5 = 7.5
		// Total = 10.5
		expect(calcCost(startTime, "mobile", 3, 5, changes)).toBe(11);
	});

	it("calculates cost with pause changes (mobile -> paused -> laptop)", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();

		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "paused",
				changed_at: new Date("2023-01-01T11:00:00Z").toISOString(),
			},
			{
				id: "2",
				session_id: "s1",
				from_device: "paused",
				to_device: "laptop",
				changed_at: new Date("2023-01-01T12:00:00Z").toISOString(),
			},
		];

		vi.setSystemTime(new Date("2023-01-01T13:00:00Z")); // 1 hr laptop (cost: 5)

		// Total = 3 + 0 + 5 = 8
		expect(calcCost(startTime, "mobile", 3, 5, changes)).toBe(8);
	});

	it("calcOrdersTotal computes total correctly", () => {
		const orders: SessionOrder[] = [
			{
				id: "1",
				session_id: "s1",
				product_id: "prod1",
				product_name: "Tea",
				size: null,
				quantity: 2,
				price_per_unit: 5,
				cost_per_unit: 2,
			},
			{
				id: "2",
				session_id: "s1",
				product_id: "prod1",
				product_name: "Coffee",
				size: null,
				quantity: 1,
				price_per_unit: 10,
				cost_per_unit: 5,
			},
		];

		expect(calcOrdersTotal(orders)).toBe(20);
	});
});
