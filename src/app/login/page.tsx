"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const supabase = createClient();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			if (
				!navigator.onLine ||
				error.message.includes("No internet connection")
			) {
				setError("لا يوجد اتصال بالإنترنت. لا يمكنك تسجيل الدخول حالياً.");
			} else {
				setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
			}
			setLoading(false);
		} else {
			sessionStorage.setItem("is_active_session", "true");
			router.push("/");
			router.refresh();
		}
	};

	return (
		<div
			dir="rtl"
			className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f] font-['Segoe_UI',Tahoma,sans-serif]"
		>
			{/* Background grid */}
			<div className="absolute inset-0 pointer-events-none bg-[image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

			{/* Glow effects */}
			<div className="absolute rounded-full pointer-events-none w-[500px] h-[500px] bg-[#4f6ef7] blur-[80px] opacity-[0.13] -top-[100px] -right-[100px]" />
			<div className="absolute rounded-full pointer-events-none w-[400px] h-[400px] bg-[#7c3aed] blur-[80px] opacity-[0.11] -bottom-[100px] -left-[50px]" />

			{/* Card */}
			<div className="relative z-10 w-full mx-4 max-w-[420px]">
				<div className="rounded-2xl p-px bg-gradient-to-br from-[#4f6ef780] via-[#7c3aed4d] to-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
					<div className="rounded-2xl px-9 py-10 bg-[#111118]">
						{/* Brand */}
						<div className="flex items-center gap-4 mb-7">
							<div className="rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 w-[52px] h-[52px] bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] text-[17px] shadow-[0_8px_20px_rgba(79,110,247,0.35)] tracking-[-1px]">
								C·M
							</div>
							<div>
								<h1 className="font-bold text-[17px] text-[#f0f0f8] tracking-[-0.3px]">
									{"Ledgr"}
								</h1>
								<p className="text-xs text-[#6b6b8a] mt-[3px]">
									نظام الإدارة المالية
								</p>
							</div>
						</div>

						{/* Divider */}
						<div className="mb-7 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

						{/* Form */}
						<form onSubmit={handleLogin} className="flex flex-col gap-5">
							{/* Email */}
							<div className="flex flex-col gap-2">
								<label
									htmlFor="email"
									className="text-[13px] text-[#9090b0] font-medium"
								>
									البريد الإلكتروني
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="example@email.com"
									required
									autoComplete="email"
									dir="ltr"
									data-testid="login-email-input"
									className="w-full outline-none rounded-xl bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] py-3 px-3.5 text-sm text-[#e8e8f5] transition-all duration-200 focus:border-[#4f6ef7] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.12)]"
								/>
							</div>

							{/* Password */}
							<div className="flex flex-col gap-2">
								<label
									htmlFor="password"
									className="text-[13px] text-[#9090b0] font-medium"
								>
									كلمة المرور
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									autoComplete="current-password"
									dir="ltr"
									data-testid="login-password-input"
									className="w-full outline-none rounded-xl bg-[#1a1a26] border-[1.5px] border-[#2a2a3e] py-3 px-3.5 text-sm text-[#e8e8f5] transition-all duration-200 focus:border-[#4f6ef7] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.12)]"
								/>
							</div>

							{/* Error */}
							{error && (
								<div data-testid="login-error-message" className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 px-3.5 text-[13px] text-red-400">
									<span className="flex items-center justify-center rounded-full flex-shrink-0 font-bold w-[18px] h-[18px] bg-red-500/20 text-[11px]">
										!
									</span>
									{error}
								</div>
							)}

							{/* Submit */}
							<button
								type="submit"
								data-testid="login-submit-button"
								disabled={loading}
								className={`w-full rounded-xl font-semibold text-white flex items-center justify-center p-[13px] text-[15px] min-h-[46px] bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] border-none shadow-[0_6px_20px_rgba(79,110,247,0.3)] mt-1 transition-opacity duration-200 ${loading ? "opacity-65 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
							>
								{loading ? (
									<span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
								) : (
									"دخول"
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
