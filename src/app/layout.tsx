import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineSyncProvider } from "@/components/OfflineSyncProvider";
import { PrivacyProvider } from "@/components/PrivacyProvider";

export const metadata: Metadata = {
	title: "Coma System",
	description: "نظام إدارة الكافيهات ومساحات العمل",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Coma System",
	},
};

export const viewport: Viewport = {
	themeColor: "#0d0d14",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ar" dir="rtl">
			<body className="m-0 p-0">
				<OfflineSyncProvider>
					<PrivacyProvider>{children}</PrivacyProvider>
				</OfflineSyncProvider>
			</body>
		</html>
	);
}
