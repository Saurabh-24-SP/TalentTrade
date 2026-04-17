export default function LoadingSpinner({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-sky-500 opacity-20 blur-xl" />
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">{text}</p>
        </div>
    );
}