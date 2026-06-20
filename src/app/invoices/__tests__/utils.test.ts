import { describe, expect, it } from "vitest";
import {
	DEVICE_LABELS,
	fmt,
	fmtDateTime,
	fmtDuration,
	STATUS_COLORS,
	STATUS_LABELS,
} from "../utils";

describe("invoices/utils", () => {
	it("STATUS_LABELS has correct translations", () => {
		expect(STATUS_LABELS.paid).toBe("مدفوع");
		expect(STATUS_LABELS.debt).toBe("دين");
		expect(STATUS_LABELS.partial).toBe("جزئي");
		expect(STATUS_LABELS.cleared).toBe("تمت التصفية");
	});

	it("STATUS_COLORS has correct mappings", () => {
		expect(STATUS_COLORS.paid).toBe("#4ade80");
		expect(STATUS_COLORS.debt).toBe("#f87171");
		expect(STATUS_COLORS.partial).toBe("#fbbf24");
		expect(STATUS_COLORS.cleared).toBe("#fbbf24");
	});

	it("DEVICE_LABELS has correct translations", () => {
		expect(DEVICE_LABELS.mobile).toBe("📱 موبايل");
		expect(DEVICE_LABELS.laptop).toBe("💻 لابتوب");
	});

	it("fmt formats numbers correctly with 2 decimal places", () => {
		expect(fmt(0)).toBe("0.00");
		expect(fmt(12.3)).toBe("12.30");
		expect(fmt(1500.555)).toBe("1,500.56"); // Handles rounding and commas
		expect(fmt(null)).toBe("0.00");
		expect(fmt(undefined)).toBe("0.00");
	});

	it("fmtDateTime formats date strings properly", () => {
		const dateStr = "2023-10-05T14:30:00Z";
		const result = fmtDateTime(dateStr);

		// The exact localized string might vary depending on system locale in jsdom
		// It might be '2023' or '٢٠٢٣', and the time might be '14:30' or '١٤:٣٠'
		const containsYear = result.includes("2023") || result.includes("٢٠٢٣");
		expect(containsYear).toBe(true);
	});

	it("fmtDuration formats minutes to hours and minutes", () => {
		expect(fmtDuration(0)).toBe("0د");
		expect(fmtDuration(45)).toBe("45د");
		expect(fmtDuration(60)).toBe("1س 0د");
		expect(fmtDuration(125)).toBe("2س 5د");
	});
});
