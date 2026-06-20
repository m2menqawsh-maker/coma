"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextType {
	isPrivacyMode: boolean;
	togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
	isPrivacyMode: false,
	togglePrivacyMode: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
	const [isPrivacyMode, setIsPrivacyMode] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const stored = localStorage.getItem("privacyMode");
		if (stored === "true") setIsPrivacyMode(true);
	}, []);

	const togglePrivacyMode = () => {
		setIsPrivacyMode((prev) => {
			const next = !prev;
			localStorage.setItem("privacyMode", String(next));
			return next;
		});
	};

	useEffect(() => {
		if (isPrivacyMode) {
			document.body.classList.add("privacy-mode");
		} else {
			document.body.classList.remove("privacy-mode");
		}
	}, [isPrivacyMode]);

	// To prevent hydration mismatch, you could return children directly or handle it
	// But it's usually fine if we don't render differently on the server for the provider itself.

	return (
		<PrivacyContext.Provider
			value={{
				isPrivacyMode: mounted ? isPrivacyMode : false,
				togglePrivacyMode,
			}}
		>
			{children}
		</PrivacyContext.Provider>
	);
}

export function usePrivacy() {
	return useContext(PrivacyContext);
}
