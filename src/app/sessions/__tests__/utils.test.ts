import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SessionDeviceChange } from "../types";
import {
	formatDeviceHistory,
	formatDuration,
	getCurrentDevice,
	getDeviceHistorySegments,
	getInitialDevice,
} from "../utils";

describe("sessions/utils", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("formatDuration without changes calculates active ms", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();
		vi.setSystemTime(new Date("2023-01-01T11:30:00Z")); // 1.5 hours later

		expect(formatDuration(startTime, "mobile", [])).toBe("1س 30د");
		expect(formatDuration(startTime, "paused", [])).toBe("0د"); // paused = 0 active ms
	});

	it("formatDuration with changes calculates correctly", () => {
		const startTime = new Date("2023-01-01T10:00:00Z").toISOString();
		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "paused",
				changed_at: new Date("2023-01-01T10:30:00Z").toISOString(), // 30m mobile
			},
			{
				id: "2",
				session_id: "s1",
				from_device: "paused",
				to_device: "laptop",
				changed_at: new Date("2023-01-01T11:00:00Z").toISOString(), // 30m paused
			},
		];
		vi.setSystemTime(new Date("2023-01-01T12:00:00Z")); // 1 hour laptop

		// total = 30m + 0 + 60m = 90m = 1س 30د
		expect(formatDuration(startTime, "mobile", changes)).toBe("1س 30د");
	});

	it("getInitialDevice returns correctly", () => {
		const session = { id: "s1", device: "mobile" } as Session;
		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "laptop",
				to_device: "mobile",
				changed_at: "2023-01-01T10:00:00Z",
			},
		];
		expect(getInitialDevice(session, [])).toBe("mobile");
		expect(getInitialDevice(session, changes)).toBe("laptop"); // First change from_device
	});

	it("getCurrentDevice returns correctly", () => {
		const session = { id: "s1", device: "mobile" } as Session;
		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "laptop",
				changed_at: "2023-01-01T10:00:00Z",
			},
			{
				id: "2",
				session_id: "s1",
				from_device: "laptop",
				to_device: "paused",
				changed_at: "2023-01-01T11:00:00Z",
			},
		];
		expect(getCurrentDevice(session, [])).toBe("mobile");
		expect(getCurrentDevice(session, changes)).toBe("paused"); // Last change to_device
	});

	it("getDeviceHistorySegments tracks transitions properly", () => {
		const session = {
			id: "s1",
			start_time: new Date("2023-01-01T10:00:00Z").toISOString(),
			device: "mobile",
		} as Session;
		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "laptop",
				changed_at: new Date("2023-01-01T11:00:00Z").toISOString(),
			},
		];
		vi.setSystemTime(new Date("2023-01-01T11:30:00Z"));

		const segments = getDeviceHistorySegments(session, changes);
		expect(segments).toEqual([
			{ device: "mobile", minutes: 60 },
			{ device: "laptop", minutes: 30 },
		]);
	});

	it("formatDeviceHistory formats properly", () => {
		const session = {
			id: "s1",
			start_time: new Date("2023-01-01T10:00:00Z").toISOString(),
			device: "mobile",
		} as Session;
		const changes: SessionDeviceChange[] = [
			{
				id: "1",
				session_id: "s1",
				from_device: "mobile",
				to_device: "laptop",
				changed_at: new Date("2023-01-01T11:00:00Z").toISOString(),
			},
		];
		vi.setSystemTime(new Date("2023-01-01T11:30:00Z"));

		expect(formatDeviceHistory(session, [])).toBe("");
		expect(formatDeviceHistory(session, changes)).toBe(
			"موبايل (60د) -> لابتوب (30د)",
		);
	});
});
