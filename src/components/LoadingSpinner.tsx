export default function LoadingSpinner() {
	return (
		<div className="px-5 py-10 flex justify-center">
			<div className="w-8 h-8 rounded-full border-[3px] border-[#4f6ef7]/10 border-t-[#4f6ef7] animate-[spin_0.8s_linear_infinite]" />
		</div>
	);
}
