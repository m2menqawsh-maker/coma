import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !serviceRoleKey) {
			return NextResponse.json(
				{
					error:
						"يرجى إضافة SUPABASE_SERVICE_ROLE_KEY في ملف .env.local أولاً لتتمكن من إنشاء الحسابات.",
				},
				{ status: 500 },
			);
		}

		const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});

		const body = await req.json();
		const { email, password, name, role } = body;

		if (!email || !password || !name || !role) {
			return NextResponse.json(
				{ error: "جميع الحقول مطلوبة" },
				{ status: 400 },
			);
		}

		// Create user in Auth
		const { data: userAuth, error: authError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
			});

		if (authError) {
			return NextResponse.json({ error: authError.message }, { status: 400 });
		}

		const userId = userAuth.user.id;

		// Create profile
		const { error: profileError } = await supabaseAdmin
			.from("user_profiles")
			.insert({
				id: userId,
				name,
				role,
			});

		if (profileError) {
			return NextResponse.json(
				{ error: profileError.message },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			user: { id: userId, email, name, role },
		});
	} catch (err: unknown) {
		return NextResponse.json(
			{ error: (err as Error).message || "خطأ داخلي في الخادم" },
			{ status: 500 },
		);
	}
}
