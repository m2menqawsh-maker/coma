export const fmt = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n) || 0);

export const fmtDate = (d: string) =>
	new Date(d).toLocaleDateString("ar-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

export const fmtDateTime = (d: string) =>
	new Date(d).toLocaleString("ar-IL", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
	palpay: "PalPay",
	jawwalpay: "JawwalPay",
	bop: "بنك فلسطين",
	isbk: "البنك الإسلامي",
	other: "أخرى",
};

export const STATUS_CONFIG: Record<string, { label: string; classes: string }> =
	{
		pending: {
			label: "بانتظار التصديق",
			classes: "text-amber-400 bg-amber-400/10 border-amber-400/25",
		},
		confirmed: {
			label: "مؤكدة",
			classes: "text-green-400 bg-green-400/10 border-green-400/25",
		},
		rejected: {
			label: "مرفوضة",
			classes: "text-red-400 bg-red-400/10 border-red-400/25",
		},
	};
