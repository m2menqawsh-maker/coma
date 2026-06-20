"use client";
import { useEffect, useState } from "react";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import { calculateInvoiceTotals } from "@/lib/finance/invoices";
import { createClient } from "@/lib/supabase/client";
import { processSingleCheckout } from "../actions/checkout";
import type {
	BankAccount,
	Customer,
	PricingConfig,
	Session,
	SessionDeviceChange,
	SessionOrder,
	Package,
	PackageItem,
} from "../types";
import type { Subscription, SubscriptionUsage } from "../../subscriptions/types";
import { applySubscriptionToSession } from "../../subscriptions/utils";
import {
	btnPrimary,
	btnSecondary,
	calcOrdersTotal,
	calcPlaceCost,
	applyPackageToSession,
	fmt,
	formatDuration,
	getDeviceHistorySegments,
	getInitialDevice,
	inputStyle,
} from "../utils";

const supabase = createClient();

interface CheckoutModalProps {
	session: Session;
	orders: SessionOrder[];
	deviceChanges: SessionDeviceChange[];
	pricing: PricingConfig;
	bankAccounts: BankAccount[];
	packages: Package[];
	packageItems: PackageItem[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function CheckoutModal({
	session,
	orders,
	deviceChanges,
	pricing,
	bankAccounts,
	packages,
	packageItems,
	onClose,
	onSuccess,
	onError,
}: CheckoutModalProps) {
	const [checkoutCustomer, setCheckoutCustomer] = useState<Customer | null>(
		null,
	);
	const [checkoutCash, setCheckoutCash] = useState("");
	const [checkoutBank, setCheckoutBank] = useState("");
	const [checkoutBankId, setCheckoutBankId] = useState("");
	const [checkoutDiscount, setCheckoutDiscount] = useState("");
	const [checkoutCreditApply, setCheckoutCreditApply] = useState("");
	const [checkoutNotes, setCheckoutNotes] = useState("");
	const [savingCheckout, setSavingCheckout] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [customerLoaded, setCustomerLoaded] = useState(false);

	const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
	const [subscriptionUsages, setSubscriptionUsages] = useState<SubscriptionUsage[]>([]);

	const [selectedPackageId, setSelectedPackageId] = useState<string>("");
	const [extraHoursMethod, setExtraHoursMethod] = useState<
		"normal" | "proportional" | "free"
	>("normal");

	// Subscription extra hours handling
	const [subExtraSessionMethod, setSubExtraSessionMethod] = useState<
		"charge" | "forgive" | "deduct_future"
	>("charge");
	const [subExtraSessionDate, setSubExtraSessionDate] = useState<string>("");

	useEffect(() => {
		const fetchCustAndSub = async () => {
			if (session.customer_id) {
				const { data: custData } = await supabase
					.from("customers")
					.select("*")
					.eq("id", session.customer_id)
					.single();
				if (custData) setCheckoutCustomer(custData);

				// Fetch active subscription for this customer
				const { data: subData } = await supabase
					.from("subscriptions")
					.select("*")
					.eq("customer_id", session.customer_id)
					.eq("is_active", true)
					.limit(1)
					.single();
				
				if (subData) {
					const { data: usageData } = await supabase
						.from("subscription_usage")
						.select("*")
						.eq("subscription_id", subData.id);
					setActiveSubscription(subData);
					if (usageData) setSubscriptionUsages(usageData);
				}

				setCustomerLoaded(true);
			} else {
				setCustomerLoaded(true);
			}
		};
		fetchCustAndSub();
	}, [session.customer_id]);

	const initialDev = getInitialDevice(session, deviceChanges);
	const selectedPackage = packages.find(p => p.id === selectedPackageId);
	
	const {
		sessionAmount,
		ordersTotal,
		packageAmount,
		extraSessionAmount,
		extraOrdersTotal,
		extraHours
	} = applyPackageToSession(
		session,
		initialDev,
		deviceChanges,
		pricing,
		orders,
		selectedPackage,
		packageItems,
		extraHoursMethod
	);

	let finalSessionAmount = sessionAmount;
	let finalOrdersTotal = ordersTotal;
	let subDiscount = 0;
	let subscriptionApplied = 0;
	let subExtraSession = 0;
	let subExtraOrders = 0;
	let subHoursCovered = 0;
	let subDrinksCovered = 0;
	let subDetails: {product_id: string, quantity: number}[] = [];
	let subExtraHours = 0;

	if (activeSubscription && !selectedPackage) {
		const subCalc = applySubscriptionToSession(
			session.start_time,
			initialDev,
			deviceChanges,
			pricing,
			orders,
			activeSubscription,
			subscriptionUsages
		);
		finalSessionAmount = subCalc.sessionAmount;
		finalOrdersTotal = subCalc.ordersTotal;
		subDiscount = subCalc.subscriptionDiscountAmount;
		subscriptionApplied = subCalc.subscriptionApplied || 0;
		subExtraSession = subCalc.extraSessionAmount;
		subExtraOrders = subCalc.extraOrdersTotal;
		subHoursCovered = subCalc.hoursCovered;
		subDrinksCovered = subCalc.drinksCovered;
		subDetails = subCalc.coveredOrderDetails;
		subExtraHours = subCalc.extraHours;

		if (subExtraHours > 0) {
			if (subExtraSessionMethod === "forgive" || subExtraSessionMethod === "deduct_future") {
				subDiscount += subExtraSession;
			}
		}
	}

	const discount = Math.max(0, parseFloat(checkoutDiscount) || 0) + subDiscount;
	const creditApplied = Math.min(
		Math.max(0, parseFloat(checkoutCreditApply) || 0),
		Math.max(0, checkoutCustomer?.balance || 0),
	);
	const placeCost = calcPlaceCost(
		session.start_time,
		initialDev,
		pricing,
		deviceChanges,
	);
	const productsCost = orders.reduce(
		(s, o) => s + o.cost_per_unit * o.quantity,
		0,
	);
	const totalCost = placeCost + productsCost;
	const cash = Math.max(0, parseFloat(checkoutCash) || 0);
	const bank = Math.max(0, parseFloat(checkoutBank) || 0);
	const totalPaid = cash + bank;

	const { totalDue, overpaidRaw, debtCreated, grossProfit } =
		calculateInvoiceTotals({
			sessionAmount: finalSessionAmount,
			ordersTotal: finalOrdersTotal,
			discount: discount, // Sub discount is included
			creditApplied,
			subscriptionApplied,
			totalPaid,
			totalCost,
		});

	const oldDebtUI = Math.max(0, -(checkoutCustomer?.balance || 0));
	const debtClearedUI = Math.min(overpaidRaw, oldDebtUI);
	const trueOverpaid = overpaidRaw - debtClearedUI;
	const trueDebt = debtCreated;
	const projectedBalance =
		(checkoutCustomer?.balance || 0) - creditApplied - trueDebt + overpaidRaw;
	const remaining = totalDue - totalPaid;

	const devCut =
		Math.round(grossProfit * (pricing.dev_percent / 100) * 100) / 100;
	const netProfit = grossProfit - devCut;

	const handleCheckoutClick = () => {
		if (grossProfit < 0) {
			setShowConfirm(true);
		} else {
			handleCheckout();
		}
	};

	const handleCheckout = async () => {
		setSavingCheckout(true);

		if (!session.customer_id && (debtCreated > 0 || overpaidRaw > 0)) {
			onError(
				"لا يمكن تسجيل دين أو رصيد دائن لعميل غير مسجل. يرجى تعديل الجلسة واختيار عميل مسجل أولاً.",
			);
			setSavingCheckout(false);
			return;
		}

		try {
			const {
				overpaid,
				debtCreated: finalDebt,
				debtClearedByOverpay,
				newBalanceFinal,
				invoiceId
			} = await processSingleCheckout(supabase, {
				session,
				customer: checkoutCustomer,
				deviceChanges,
				pricing,
				orders,
				initialDev,
				sessionAmount: finalSessionAmount,
				ordersTotal: finalOrdersTotal,
				discount,
				creditApplied,
				placeCost,
				productsCost,
				totalCost,
				cash,
				bank,
				bankAccountId: checkoutBankId || null,
				notes: checkoutNotes + (subscriptionApplied > 0 ? (checkoutNotes ? " — " : "") + `مُغطى باشتراك: ₪${fmt(subscriptionApplied)}` : ""),
				grossProfit,
				devCut,
				netProfit,
				totalDue,
				debtCreated,
				overpaidRaw,
				debtClearedByOverpay: Math.min(
					overpaidRaw,
					Math.max(0, -(checkoutCustomer?.balance || 0)),
				),
				packageId: selectedPackageId || null,
				extraHoursMethod: selectedPackageId ? extraHoursMethod : null,
				packageAmount: selectedPackageId ? packageAmount : 0,

				activeSubscription,
				subHoursCovered,
				subDrinksCovered,
				subDetails,
				subExtraHours,
				subExtraSessionMethod,
				subExtraSessionDate,
			});

			const msgs = [];
			if (finalDebt > 0) msgs.push(`دين ₪${fmt(finalDebt)} سُجّل`);
			else if (debtClearedByOverpay > 0 && overpaid === 0)
				msgs.push(`تم تصفية الدين ✓`);
			else if (newBalanceFinal > 0 && overpaidRaw > 0)
				msgs.push(`رصيد دائن ₪${fmt(newBalanceFinal)}`);

			onSuccess(msgs.length > 0 ? msgs.join(" — ") : "تم إغلاق الجلسة ✓");
		} catch (err: any) {
			onError(err.message);
			setSavingCheckout(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 overflow-y-auto">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[460px] border border-white/10 m-auto">
				<h2 className="text-base font-bold text-[#f0f0f8] mb-1">
					إغلاق جلسة — {session.customer_name}
				</h2>
				<div className="mb-4">
					<p className="text-xs text-[#6b6b8a] mb-2 leading-relaxed">
						إجمالي الوقت: {formatDuration(session.start_time)}
					</p>

					{(() => {
						const segments = getDeviceHistorySegments(session, deviceChanges);
						if (segments.length === 0) {
							return (
								<div className="text-xs text-[#9090b0]">
									الجهاز:{" "}
									{session.device === "mobile" ? "📱 موبايل" : "💻 لابتوب"}
								</div>
							);
						}
						return (
							<div className="flex flex-wrap gap-1.5 items-center">
								<span className="text-[#9090b0] text-xs">سجل الأجهزة:</span>
								{segments.map((seg, i) => (
									<div key={i} className="flex items-center gap-1.5">
										<span
											className={`py-0.5 px-2 rounded-md text-[11px] ${
												seg.device === "paused"
													? "bg-amber-400/15 text-amber-400"
													: "bg-indigo-400/15 text-indigo-400"
											}`}
										>
											{seg.device === "mobile"
												? "📱 موبايل"
												: seg.device === "laptop"
													? "💻 لابتوب"
													: "⏸️ متوقف"}{" "}
											({seg.minutes}د)
										</span>
										{i < segments.length - 1 && (
											<span className="text-[#6b6b8a] text-[10px]">←</span>
										)}
									</div>
								))}
							</div>
						);
					})()}
				</div>

				{checkoutCustomer && checkoutCustomer.balance !== 0 && (
					<div
						className={`bg-[#0d0d14] rounded-lg p-3 mb-3.5 border ${checkoutCustomer.balance > 0 ? "border-green-400/15" : "border-red-400/15"}`}
					>
						<div className="text-[10px] text-[#6b6b8a] mb-1">
							{checkoutCustomer.balance > 0
								? "رصيد دائن متاح"
								: "دين سابق على الزبون"}
						</div>
						<div
							className={`text-lg font-bold ${checkoutCustomer.balance > 0 ? "text-green-400" : "text-red-400"}`}
						>
							{checkoutCustomer.balance > 0 ? "+" : ""}₪
							{fmt(checkoutCustomer.balance)}
						</div>
					</div>
				)}

				<div className="bg-[#0d0d14] rounded-lg py-3 px-3.5 mb-4 flex flex-col gap-1.5">
					{packages.length > 0 && (
						<div className="mb-2.5 pb-2.5 border-b border-white/5">
							<label className="text-xs text-indigo-400 block mb-1.5 font-semibold">
								❖ الدفع عن طريق بكج (اختياري)
							</label>
							<select
								className={inputStyle}
								value={selectedPackageId}
								onChange={(e) => setSelectedPackageId(e.target.value)}
							>
								<option value="">بدون بكج (حساب عادي)</option>
								{packages.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} ({p.hours}س بـ ₪{p.price})
									</option>
								))}
							</select>
							
							{selectedPackage && extraHours > 0 && (
								<div className="mt-2.5">
									<label className="text-xs text-[#9090b0] block mb-1.5">
										الساعات الزائدة ({extraHours.toFixed(1)}س)
									</label>
									<select
										className={inputStyle}
										value={extraHoursMethod}
										onChange={(e) => setExtraHoursMethod(e.target.value as any)}
									>
										<option value="normal">حساب بالسعر العادي</option>
										<option value="proportional">حساب بنسبة من البكج</option>
										<option value="free">مشمولة (مجاناً)</option>
									</select>
								</div>
							)}
						</div>
					)}
					
					{activeSubscription && !selectedPackage ? (
						<>
							<div className="flex justify-between text-[13px] text-green-400 font-semibold mb-1">
								<span>تغطية الاشتراك ({activeSubscription.name})</span>
								<span>₪{subscriptionApplied.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-[12px] text-zinc-400 mb-2 pl-2">
								<span>غُطّي: {subHoursCovered.toFixed(1)}س, {subDrinksCovered} مشـروب</span>
							</div>
							{finalSessionAmount > 0 && (
								<div className="flex justify-between text-[13px] text-[#9090b0]">
									<span>ساعات إضافية غير مغطاة</span>
									<span>₪{finalSessionAmount.toFixed(2)}</span>
								</div>
							)}
							{finalOrdersTotal > 0 && (
								<div className="flex justify-between text-[13px] text-[#9090b0]">
									<span>منتجات إضافية غير مغطاة</span>
									<span>₪{finalOrdersTotal.toFixed(2)}</span>
								</div>
							)}
						</>
					) : selectedPackage ? (
						<>
							<div className="flex justify-between text-[13px] text-indigo-400 font-semibold">
								<span>البكج ({selectedPackage.name})</span>
								<span>₪{packageAmount.toFixed(2)}</span>
							</div>
							{extraSessionAmount > 0 && (
								<div className="flex justify-between text-[13px] text-[#9090b0]">
									<span>ساعات إضافية</span>
									<span>₪{extraSessionAmount.toFixed(2)}</span>
								</div>
							)}
							{extraOrdersTotal > 0 && (
								<div className="flex justify-between text-[13px] text-[#9090b0]">
									<span>منتجات إضافية</span>
									<span>₪{extraOrdersTotal.toFixed(2)}</span>
								</div>
							)}
						</>
					) : (
						<>
							<div className="flex justify-between text-[13px] text-[#9090b0]">
								<span>الجلسة</span>
								<span>₪{finalSessionAmount.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-[13px] text-[#9090b0]">
								<span>المنتجات</span>
								<span>₪{finalOrdersTotal.toFixed(2)}</span>
							</div>
						</>
					)}
					{(discount - subDiscount) > 0 && (
						<div className="flex justify-between text-[13px] text-red-400">
							<span>خصم</span>
							<span>-₪{(discount - subDiscount).toFixed(2)}</span>
						</div>
					)}
					{creditApplied > 0 && (
						<div className="flex justify-between text-[13px] text-green-400">
							<span>رصيد مُطبَّق</span>
							<span>-₪{creditApplied.toFixed(2)}</span>
						</div>
					)}
					<div className="flex justify-between text-[15px] font-bold text-[#f0f0f8] border-t border-white/5 pt-1.5 mt-1">
						<span>المستحق</span>
						<span>₪{totalDue.toFixed(2)}</span>
					</div>
			</div>

			{activeSubscription && !selectedPackage && subExtraHours > 0 && (
				<div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-[14px] flex flex-col gap-3">
					<div className="text-[13px] text-indigo-300">
						يوجد {subExtraHours.toFixed(1)} ساعة إضافية فوق حد الاشتراك المسموح. اختر كيف تريد المحاسبة عليها:
					</div>
					<div className="flex flex-col gap-2">
						<label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
							<input
								type="radio"
								name="subExtraMethod"
								className="accent-indigo-500"
								checked={subExtraSessionMethod === "charge"}
								onChange={() => setSubExtraSessionMethod("charge")}
							/>
							محاسبة طبيعية 
							<span className="text-zinc-500 text-[11px]">(سيتم إضافة ثمنها للفاتورة)</span>
						</label>
						<label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
							<input
								type="radio"
								name="subExtraMethod"
								className="accent-indigo-500"
								checked={subExtraSessionMethod === "forgive"}
								onChange={() => setSubExtraSessionMethod("forgive")}
							/>
							مسامحة 
							<span className="text-zinc-500 text-[11px]">(تجاهل الزيادة تماماً)</span>
						</label>
						<label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
							<input
								type="radio"
								name="subExtraMethod"
								className="accent-indigo-500"
								checked={subExtraSessionMethod === "deduct_future"}
								onChange={() => setSubExtraSessionMethod("deduct_future")}
							/>
							خصم من رصيد يوم آخر
						</label>
					</div>
					
					{subExtraSessionMethod === "deduct_future" && (
						<div className="mt-1">
							<label className="block text-xs text-indigo-300 mb-1">حدد التاريخ لخصم الساعات منه:</label>
							<input
								type="date"
								className="w-full bg-[#111118] border border-indigo-500/30 rounded py-1.5 px-3 text-sm text-white"
								value={subExtraSessionDate}
								onChange={(e) => setSubExtraSessionDate(e.target.value)}
							/>
						</div>
					)}
				</div>
			)}

			<div className="flex flex-col gap-3">
					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							خصم (₪)
						</label>
						<input
							className={inputStyle}
							type="number"
							min="0"
							dir="ltr"
							value={checkoutDiscount}
							onChange={(e) => setCheckoutDiscount(e.target.value)}
							placeholder="0"
						/>
					</div>

					{checkoutCustomer && checkoutCustomer.balance > 0 && (
						<div>
							<label className="text-xs text-green-400 block mb-1.5">
								تطبيق رصيد دائن (متاح: ₪{fmt(checkoutCustomer.balance)})
							</label>
							<input
								className={`${inputStyle} ${creditApplied > 0 ? "border-green-400/40 focus:border-green-400/40" : ""}`}
								type="number"
								min="0"
								max={checkoutCustomer.balance}
								dir="ltr"
								value={checkoutCreditApply}
								onChange={(e) => setCheckoutCreditApply(e.target.value)}
								placeholder="0"
							/>
						</div>
					)}

					<div>
						<label className="text-xs text-amber-400 block mb-1.5">
							كاش (₪)
						</label>
						<input
							className={inputStyle}
							type="number"
							min="0"
							dir="ltr"
							value={checkoutCash}
							onChange={(e) => setCheckoutCash(e.target.value)}
							placeholder="0"
						/>
					</div>
					<div>
						<label className="text-xs text-blue-400 block mb-1.5">
							تحويل بنكي (₪)
						</label>
						<input
							className={inputStyle}
							type="number"
							min="0"
							dir="ltr"
							value={checkoutBank}
							onChange={(e) => setCheckoutBank(e.target.value)}
							placeholder="0"
						/>
					</div>
					{parseFloat(checkoutBank) > 0 && bankAccounts.length > 0 && (
						<div>
							<label className="text-xs text-[#9090b0] block mb-1.5">
								الحساب البنكي
							</label>
							<select
								className={inputStyle}
								value={checkoutBankId}
								onChange={(e) => setCheckoutBankId(e.target.value)}
							>
								<option value="">اختر حساب...</option>
								{bankAccounts.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
						</div>
					)}

					{totalPaid > 0 && (
						<div className="flex flex-col gap-1.5">
							{trueDebt > 0 && (
								<div className="bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 px-3.5 flex justify-between">
									<span className="text-[13px] text-red-400">
										⚠️ دين جديد على الزبون
									</span>
									<span className="text-[15px] font-bold text-red-400">
										₪{fmt(trueDebt)}
									</span>
								</div>
							)}
							{debtClearedUI > 0 && (
								<div className="bg-amber-400/5 border border-amber-400/20 rounded-lg py-2.5 px-3.5 flex justify-between">
									<span className="text-[13px] text-amber-400">
										✦ تصفية دين قديم
									</span>
									<span className="text-sm font-bold text-amber-400">
										-₪{fmt(debtClearedUI)}
									</span>
								</div>
							)}
							{trueOverpaid > 0 && (
								<div className="bg-green-400/5 border border-green-400/20 rounded-lg py-2.5 px-3.5 flex justify-between">
									<span className="text-[13px] text-green-400">
										✦ رصيد دائن
										{!checkoutCustomer ? " (لا يُحفظ — زبون غير مسجل)" : ""}
									</span>
									<span className="text-sm font-bold text-green-400">
										+₪{fmt(trueOverpaid)}
									</span>
								</div>
							)}
							{checkoutCustomer && totalPaid > 0 && (
								<div className="bg-white/5 border border-white/10 rounded-lg py-2.5 px-3.5 flex justify-between">
									<span className="text-xs text-[#6b6b8a]">
										رصيد الزبون بعد الإغلاق
									</span>
									<span
										className={`text-sm font-bold ${
											projectedBalance > 0
												? "text-green-400"
												: projectedBalance < 0
													? "text-red-400"
													: "text-[#6b6b8a]"
										}`}
									>
										{projectedBalance > 0 ? "+" : ""}₪{fmt(projectedBalance)}
									</span>
								</div>
							)}
							{trueDebt === 0 &&
								trueOverpaid === 0 &&
								debtClearedUI === 0 &&
								remaining === 0 && (
									<div className="bg-indigo-400/5 border border-indigo-400/20 rounded-lg py-2.5 px-3.5 text-center">
										<span className="text-[13px] text-indigo-400">
											✓ مسدد بالكامل
										</span>
									</div>
								)}
						</div>
					)}

					<div>
						<label className="text-xs text-[#9090b0] block mb-1.5">
							ملاحظات
						</label>
						<input
							className={inputStyle}
							value={checkoutNotes}
							onChange={(e) => setCheckoutNotes(e.target.value)}
							placeholder="..."
						/>
					</div>
				</div>

				<div className="flex gap-2.5 mt-5.5">
					<button className={btnSecondary} onClick={onClose}>
						إلغاء
					</button>
					<button
						className={`${btnPrimary} flex-1 ${savingCheckout || !customerLoaded ? "opacity-60" : "opacity-100"}`}
						onClick={handleCheckoutClick}
						disabled={savingCheckout || !customerLoaded}
					>
						{savingCheckout ? "جاري الإغلاق..." : "إغلاق وتسجيل"}
					</button>
				</div>
			</div>
			<DoubleConfirmModal
				isOpen={showConfirm}
				title="تأكيد الخسارة المالية"
				message={`الخصم الذي أدخلته أكبر من هامش الربح، وسيؤدي إلى خسارة بقيمة (-${fmt(Math.abs(grossProfit))} ₪) في هذه الفاتورة. هل أنت متأكد من إتمام العملية؟`}
				onConfirm={() => {
					setShowConfirm(false);
					handleCheckout();
				}}
				onCancel={() => setShowConfirm(false)}
			/>
		</div>
	);
}
