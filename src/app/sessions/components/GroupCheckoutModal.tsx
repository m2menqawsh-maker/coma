"use client";
import { useEffect, useMemo, useState } from "react";
import DoubleConfirmModal from "@/components/DoubleConfirmModal";
import { calculateInvoiceTotals } from "@/lib/finance/invoices";
import { createClient } from "@/lib/supabase/client";
import { processGroupCheckout } from "../actions/checkout";
import type {
	BankAccount,
	Customer,
	PricingConfig,
	Session,
	SessionDeviceChange,
	SessionOrder,
} from "../types";
import {
	btnPrimary,
	btnSecondary,
	calcOrdersTotal,
	calcPlaceCost,
	calcSessionAmount,
	fmt,
	formatDuration,
	getInitialDevice,
	inputStyle,
} from "../utils";

const supabase = createClient();

interface GroupCheckoutModalProps {
	sessions: Session[];
	orders: Record<string, SessionOrder[]>;
	deviceChanges: Record<string, SessionDeviceChange[]>;
	pricing: PricingConfig;
	bankAccounts: BankAccount[];
	onClose: () => void;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

export default function GroupCheckoutModal({
	sessions,
	orders,
	deviceChanges,
	pricing,
	bankAccounts,
	onClose,
	onSuccess,
	onError,
}: GroupCheckoutModalProps) {
	const [groupSelected, setGroupSelected] = useState<string[]>([]);
	const [groupPrimaryId, setGroupPrimaryId] = useState<string>("");
	const [groupCash, setGroupCash] = useState("");
	const [groupBank, setGroupBank] = useState("");
	const [groupBankId, setGroupBankId] = useState("");
	const [groupDiscount, setGroupDiscount] = useState("");
	const [groupNotes, setGroupNotes] = useState("");
	const [savingGroup, setSavingGroup] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [groupCreditApply, setGroupCreditApply] = useState("");
	const [primaryCustomer, setPrimaryCustomer] = useState<Customer | null>(null);

	useEffect(() => {
		const fetchCust = async () => {
			if (groupPrimaryId) {
				const primarySession = sessions.find((s) => s.id === groupPrimaryId);
				if (primarySession?.customer_id) {
					const { data } = await supabase
						.from("customers")
						.select("*")
						.eq("id", primarySession.customer_id)
						.single();
					if (data) setPrimaryCustomer(data);
					else setPrimaryCustomer(null);
				} else {
					setPrimaryCustomer(null);
				}
			} else {
				setPrimaryCustomer(null);
			}
		};
		fetchCust();
	}, [groupPrimaryId, sessions]);

	const selectedSessions = useMemo(
		() => sessions.filter((s) => groupSelected.includes(s.id)),
		[sessions, groupSelected],
	);

	const sessionAmounts = useMemo(
		() =>
			selectedSessions.map((s) => {
				const changes = deviceChanges[s.id] || [];
				const initialDev = getInitialDevice(s, changes);
				return {
					session: s,
					changes: changes,
					initialDev: initialDev,
					sessionAmt: calcSessionAmount(
						s.start_time,
						initialDev,
						pricing,
						changes,
					),
					ordersAmt: calcOrdersTotal(orders[s.id] || []),
				};
			}),
		[selectedSessions, deviceChanges, pricing, orders],
	);

	const discount = Math.max(0, parseFloat(groupDiscount) || 0);
	const creditApplied = Math.min(
		Math.max(0, parseFloat(groupCreditApply) || 0),
		Math.max(0, primaryCustomer?.balance || 0),
	);
	const cash = Math.max(0, parseFloat(groupCash) || 0);
	const bank = Math.max(0, parseFloat(groupBank) || 0);
	const totalPaid = cash + bank;

	const groupSessionAmount = sessionAmounts.reduce(
		(sum, x) => sum + x.sessionAmt,
		0,
	);
	const groupOrdersTotal = sessionAmounts.reduce(
		(sum, x) => sum + x.ordersAmt,
		0,
	);

	const totalCost = sessionAmounts.reduce(
		(sum, { session, changes, initialDev }) => {
			const placeCost = calcPlaceCost(
				session.start_time,
				initialDev,
				pricing,
				changes,
			);
			const sessionOrders = orders[session.id] || [];
			const productsCost = sessionOrders.reduce(
				(s: number, o: SessionOrder) => s + o.cost_per_unit * o.quantity,
				0,
			);
			return sum + placeCost + productsCost;
		},
		0,
	);

	const groupTotals = calculateInvoiceTotals({
		sessionAmount: groupSessionAmount,
		ordersTotal: groupOrdersTotal,
		discount,
		creditApplied,
		totalPaid,
		totalCost,
	});

	const grandTotal = groupTotals.totalAmount;
	const debtCreated = groupTotals.debtCreated;
	const overpaidRaw = groupTotals.overpaidRaw;
	const totalGrossProfit = groupTotals.grossProfit;

	const toggleGroupSelect = (id: string) => {
		if (groupSelected.includes(id)) {
			const next = groupSelected.filter((x) => x !== id);
			setGroupSelected(next);
			if (groupPrimaryId === id) setGroupPrimaryId("");
		} else {
			setGroupSelected([...groupSelected, id]);
		}
	};

	const handleGroupCheckoutClick = () => {
		if (groupSelected.length < 2 || !groupPrimaryId) return;
		if (totalGrossProfit < 0) {
			setShowConfirm(true);
		} else {
			handleGroupCheckout();
		}
	};

	const handleGroupCheckout = async () => {
		if (groupSelected.length < 2 || !groupPrimaryId) return;
		setSavingGroup(true);

		const primarySession = selectedSessions.find(
			(s) => s.id === groupPrimaryId,
		)!;

		if (!primarySession.customer_id && (debtCreated > 0 || overpaidRaw > 0)) {
			onError(
				"لا يمكن تسجيل دين أو رصيد دائن لعميل غير مسجل. يرجى اختيار عميل مسجل أولاً.",
			);
			setSavingGroup(false);
			return;
		}

		try {
			await processGroupCheckout(supabase, {
				groupSelected,
				groupPrimaryId,
				selectedSessions,
				sessionAmounts,
				orders,
				pricing,
				primaryCustomer,
				discount,
				creditApplied,
				cash,
				bank,
				bankAccountId: groupBankId || null,
				notes: groupNotes,
				debtCreated,
				overpaidRaw,
				totalPaid,
			});

			const msg =
				debtCreated > 0
					? `تم إغلاق ${groupSelected.length} جلسات — دين ₪${fmt(debtCreated)} على ${primarySession.customer_name}`
					: `تم إغلاق ${groupSelected.length} جلسات بنجاح ✓`;

			onSuccess(msg);
		} catch (err: any) {
			onError(err.message);
			setSavingGroup(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 overflow-y-auto">
			<div className="bg-[#111118] rounded-2xl p-7 w-full max-w-[560px] border border-indigo-400/20 m-auto">
				<div className="flex justify-between items-center mb-5">
					<div>
						<h2 className="text-base font-bold text-[#f0f0f8]">
							فاتورة جماعية
						</h2>
						<p className="text-xs text-[#6b6b8a] mt-[3px]">
							اختر الجلسات ثم حدد الزبون المسؤول عن الدفع
						</p>
					</div>
					<button
						onClick={onClose}
						className="bg-transparent border-none text-[#6b6b8a] text-lg cursor-pointer hover:text-white transition-colors"
					>
						✕
					</button>
				</div>

				<div className="mb-4.5">
					<div className="text-xs text-[#9090b0] mb-2.5 font-semibold">
						اختر الجلسات ({groupSelected.length} محدد)
					</div>
					<div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
						{sessions.map((s) => {
							const isSelected = groupSelected.includes(s.id);
							const isPrimary = groupPrimaryId === s.id;
							const sAmount =
								sessionAmounts.find((x) => x.session.id === s.id)?.sessionAmt ||
								0;
							const oAmount =
								sessionAmounts.find((x) => x.session.id === s.id)?.ordersAmt ||
								0;
							return (
								<div key={s.id} className="flex gap-2.5 items-center">
									<div
										onClick={() => toggleGroupSelect(s.id)}
										className={`flex-1 flex justify-between items-center py-2.5 px-3.5 rounded-lg cursor-pointer border-[1.5px] transition-colors ${
											isSelected
												? "bg-indigo-400/10 border-indigo-400"
												: "bg-[#1a1a26] border-[#2a2a3e] hover:bg-[#20202e]"
										}`}
									>
										<div>
											<div
												className={`text-[13px] ${isSelected ? "text-[#e0e0f0] font-semibold" : "text-[#a0a0c0] font-normal"}`}
											>
												{s.customer_name}
											</div>
											<div className="text-[11px] text-[#6b6b8a]">
												{formatDuration(s.start_time)}
											</div>
										</div>
										<div
											className={`text-[13px] font-bold ${isSelected ? "text-indigo-400" : "text-[#9090b0]"}`}
										>
											₪{(sAmount + oAmount).toFixed(2)}
										</div>
									</div>
									{isSelected && (
										<button
											onClick={() => setGroupPrimaryId(s.id)}
											className={`py-2 px-3 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
												isPrimary
													? "border-amber-400/80 bg-amber-400/15 text-amber-400"
													: "border-[#2a2a3e] bg-[#1a1a26] text-[#6b6b8a] hover:bg-[#20202e]"
											}`}
										>
											{isPrimary ? "⭐ المسؤول" : "تعيين كمسؤول"}
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{groupSelected.length >= 2 && groupPrimaryId && (
					<div className="bg-[#0d0d14] rounded-xl p-4 border border-indigo-400/20">
						<div className="flex justify-between text-sm text-[#9090b0] mb-2">
							<span>إجمالي الجلسات المختارة</span>
							<span>₪{grandTotal.toFixed(2)}</span>
						</div>

						<div className="grid grid-cols-2 gap-3 mb-3 mt-3">
							<div>
								<label className="text-xs text-red-400 block mb-1.5">
									خصم للمسؤول (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									value={groupDiscount}
									onChange={(e) => setGroupDiscount(e.target.value)}
									placeholder="0"
								/>
							</div>
							{primaryCustomer && primaryCustomer.balance > 0 && (
								<div>
									<label className="text-xs text-green-400 block mb-1.5">
										رصيد مُطبَّق (متاح: ₪{fmt(primaryCustomer.balance)})
									</label>
									<input
										className={`${inputStyle} ${groupCreditApply ? "border-green-400/40 focus:border-green-400/40" : ""}`}
										type="number"
										min="0"
										max={primaryCustomer.balance}
										value={groupCreditApply}
										onChange={(e) => setGroupCreditApply(e.target.value)}
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
									value={groupCash}
									onChange={(e) => setGroupCash(e.target.value)}
									placeholder="0"
								/>
							</div>
							<div>
								<label className="text-xs text-blue-400 block mb-1.5">
									بنك (₪)
								</label>
								<input
									className={inputStyle}
									type="number"
									min="0"
									value={groupBank}
									onChange={(e) => setGroupBank(e.target.value)}
									placeholder="0"
								/>
							</div>
							{parseFloat(groupBank) > 0 && bankAccounts.length > 0 && (
								<div>
									<label className="text-xs text-[#9090b0] block mb-1.5">
										الحساب البنكي
									</label>
									<select
										className={inputStyle}
										value={groupBankId}
										onChange={(e) => setGroupBankId(e.target.value)}
									>
										<option value="">اختر...</option>
										{bankAccounts.map((b) => (
											<option key={b.id} value={b.id}>
												{b.name}
											</option>
										))}
									</select>
								</div>
							)}
						</div>

						{debtCreated > 0 && (
							<div className="bg-red-500/10 rounded-lg p-3 mt-3">
								<div className="text-xs text-red-400">
									⚠️ سيتم تسجيل دين جماعي على:
								</div>
								<div className="text-sm font-bold text-red-400 mt-1">
									{sessions.find((s) => s.id === groupPrimaryId)?.customer_name}{" "}
									— ₪{fmt(debtCreated)}
								</div>
							</div>
						)}

						<div className="mt-3">
							<label className="text-xs text-[#9090b0] block mb-1.5">
								ملاحظات الفاتورة
							</label>
							<input
								className={inputStyle}
								value={groupNotes}
								onChange={(e) => setGroupNotes(e.target.value)}
								placeholder="..."
							/>
						</div>

						<div className="flex gap-2.5 mt-6">
							<button className={btnSecondary} onClick={onClose}>
								إلغاء
							</button>
							<button
								className={`${btnPrimary} flex-1 ${savingGroup ? "opacity-60" : "opacity-100"}`}
								onClick={handleGroupCheckoutClick}
								disabled={savingGroup}
							>
								{savingGroup ? "جاري الإغلاق..." : "تأكيد ودفع"}
							</button>
						</div>
					</div>
				)}
			</div>
			<DoubleConfirmModal
				isOpen={showConfirm}
				title="تأكيد الخسارة المالية (مجموعة)"
				message={`الخصم الجماعي يؤدي إلى خسارة بقيمة (-${fmt(Math.abs(totalGrossProfit))} ₪) في هذه الفواتير. هل أنت متأكد من إتمام العملية؟`}
				onConfirm={() => {
					setShowConfirm(false);
					handleGroupCheckout();
				}}
				onCancel={() => setShowConfirm(false)}
			/>
		</div>
	);
}
