"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import type { Customer, Product } from "@/app/sessions/types";
import type { Subscription } from "./types";
import CreateSubscriptionForm from "./components/CreateSubscriptionModal";
import SubscriptionUsageModal from "./components/SubscriptionUsageModal";
import { btnPrimary } from "@/app/sessions/utils";

export default function SubscriptionsPage() {
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [pricing, setPricing] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"list" | "create">("list");
	const [showUsageFor, setShowUsageFor] = useState<{id: string, name: string} | null>(null);

	const fetchInitialData = async () => {
		try {
			setIsLoading(true);
			const supabase = createClient();
			
			const [subsRes, custRes, prodRes, pricingRes] = await Promise.all([
				supabase.from("subscriptions").select("*, customers(name)").order("created_at", { ascending: false }),
				supabase.from("customers").select("id, name, phone").order("name"),
				supabase.from("products").select("id, name").eq("is_active", true),
				supabase.from("pricing_config").select("*").order("effective_from", { ascending: false }).limit(1)
			]);

			if (subsRes.error) throw subsRes.error;
			if (custRes.error) throw custRes.error;
			if (prodRes.error) throw prodRes.error;
			if (pricingRes.error) throw pricingRes.error;

			setSubscriptions(subsRes.data || []);
			setCustomers(custRes.data || []);
			setProducts(prodRes.data || []);
			setPricing(pricingRes.data?.[0] || null);
		} catch (error: any) {
			toast.error("خطأ في جلب البيانات: " + error.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchInitialData();
	}, []);

	const handleCreateSubscription = async (data: any) => {
		try {
			const supabase = createClient();
			
			// 1. Insert subscription
			const { data: newSub, error } = await supabase
				.from("subscriptions")
				.insert([data])
				.select()
				.single();

			if (error) throw error;
			
			// 2. Add an invoice/ledger entry to record the payment of the subscription (price & cost)
			// For simplicity and alignment with the app logic, we will record a ledger entry for the income directly.
			// The user wants it to be treated as a transfer or direct income to the cash/bank.
			// Let's create an invoice for this subscription so it's formally recorded and profit is calculated.
			
			const { data: userProfile } = await supabase.auth.getUser();
			const userId = userProfile?.user?.id;
			
			const customer = customers.find(c => c.id === data.customer_id);

			const { error: invoiceError } = await supabase.from("invoices").insert([{
				customer_id: data.customer_id,
				customer_name: customer?.name || "زبون مجهول",
				session_start: new Date().toISOString(),
				session_end: new Date().toISOString(),
				duration_minutes: 0,
				device: "paused",
				hourly_rate_snapshot: 0,
				place_cost_rate_snap: 0,
				dev_percent_snapshot: 0,
				session_amount: data.price,
				total_amount: data.price,
				total_due: data.price, // customer pays everything now? Usually subscriptions are prepaid.
				cash_paid: data.price, // assuming cash paid for now
				total_cost: data.cost,
				net_profit: data.price - data.cost,
				status: 'paid',
				notes: `شراء اشتراك: ${data.name}`,
				closed_by: userId
			}]);
			
			if (invoiceError) throw invoiceError;

			toast.success("تم إنشاء الاشتراك بنجاح");
			setActiveTab("list");
			fetchInitialData();
		} catch (error: any) {
			toast.error("خطأ أثناء إنشاء الاشتراك: " + error.message);
		}
	};

	const toggleSubscriptionStatus = async (id: string, currentStatus: boolean) => {
		try {
			const supabase = createClient();
			const { error } = await supabase
				.from("subscriptions")
				.update({ is_active: !currentStatus })
				.eq("id", id);

			if (error) throw error;
			toast.success(currentStatus ? "تم إيقاف الاشتراك" : "تم تفعيل الاشتراك");
			fetchInitialData();
		} catch (error: any) {
			toast.error("خطأ: " + error.message);
		}
	};

	return (
		<AppLayout>
			<div className="p-8 max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold text-white">إدارة الاشتراكات</h1>
				</div>
				
				<div className="flex border-b border-[#2a2a3e] mb-6 gap-6">
					<button
						onClick={() => setActiveTab("list")}
						className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "list" ? "text-indigo-400" : "text-zinc-400 hover:text-white"}`}
					>
						قائمة الاشتراكات
						{activeTab === "list" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
					</button>
					<button
						onClick={() => setActiveTab("create")}
						className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "create" ? "text-indigo-400" : "text-zinc-400 hover:text-white"}`}
					>
						إنشاء اشتراك جديد
						{activeTab === "create" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>}
					</button>
				</div>

				{isLoading ? (
					<div className="flex justify-center p-10">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
					</div>
				) : activeTab === "list" ? (
					<div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden shadow-lg">
						<div className="overflow-x-auto">
							<table className="w-full text-right text-sm">
								<thead className="bg-[#1a1a26]/80 text-zinc-400 border-b border-[#2a2a3e]">
									<tr>
										<th className="px-6 py-4 font-medium">الزبون</th>
										<th className="px-6 py-4 font-medium">اسم الاشتراك</th>
										<th className="px-6 py-4 font-medium">النوع</th>
										<th className="px-6 py-4 font-medium">المدة</th>
										<th className="px-6 py-4 font-medium">السعر</th>
										<th className="px-6 py-4 font-medium">الحالة</th>
										<th className="px-6 py-4 font-medium text-center">إجراءات</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#2a2a3e]">
									{subscriptions.length === 0 ? (
										<tr>
											<td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
												لا يوجد اشتراكات حالياً
											</td>
										</tr>
									) : (
										subscriptions.map((sub: any) => (
											<tr key={sub.id} className="hover:bg-white/5 transition-colors">
												<td className="px-6 py-4 text-white">{sub.customers?.name}</td>
												<td className="px-6 py-4 text-zinc-300">{sub.name}</td>
												<td className="px-6 py-4 text-zinc-300">
													{sub.type === "days" ? `ساعات يومية (${sub.daily_hours_limit}س)` : `رصيد كلي (${sub.bulk_hours_limit}س)`}
												</td>
												<td className="px-6 py-4 text-zinc-300">
													<div className="text-xs text-zinc-400">{sub.start_date}</div>
													<div className="text-xs text-zinc-400">{sub.end_date}</div>
												</td>
												<td className="px-6 py-4 text-indigo-400 font-medium">{sub.price} ₪</td>
												<td className="px-6 py-4">
													<span className={`px-2 py-1 rounded text-xs ${sub.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
														{sub.is_active ? "فعال" : "متوقف"}
													</span>
												</td>
												<td className="px-6 py-4 flex justify-center gap-2">
													<button 
														onClick={() => setShowUsageFor({id: sub.id, name: sub.name})}
														className="text-xs px-3 py-1.5 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20"
													>
														سجل الاستخدام
													</button>
													<button 
														onClick={() => toggleSubscriptionStatus(sub.id, sub.is_active)}
														className="text-xs px-3 py-1.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10"
													>
														{sub.is_active ? "إيقاف" : "تفعيل"}
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				) : null}

				{!isLoading && activeTab === "create" && (
					<CreateSubscriptionForm
						onCancel={() => setActiveTab("list")}
						onSave={handleCreateSubscription}
						customers={customers}
						products={products}
						pricing={pricing}
					/>
				)}
			</div>

			{showUsageFor && (
				<SubscriptionUsageModal
					subscriptionId={showUsageFor.id}
					subscriptionName={showUsageFor.name}
					onClose={() => setShowUsageFor(null)}
				/>
			)}
		</AppLayout>
	);
}
