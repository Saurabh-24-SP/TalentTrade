import { Link } from "react-router-dom";
import { GlassCard, PageShell, Reveal } from "../components/PremiumMotion";

export default function NotFound() {
    return (
        <PageShell>
            <div className="flex min-h-screen items-center justify-center px-4 py-12">
                <Reveal className="w-full max-w-xl">
                    <GlassCard className="px-8 py-12 text-center md:px-12">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-indigo-600 to-sky-500 text-4xl text-white shadow-lg shadow-indigo-500/25">
                            ⏰
                        </div>
                        <h1 className="mt-6 text-6xl font-black tracking-tight text-slate-900">404</h1>
                        <h2 className="mt-3 text-2xl font-bold text-slate-800">Page not found</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                            The page you are looking for does not exist or has been moved.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link to="/" className="premium-button px-6 py-3 text-sm">
                                Go home
                            </Link>
                            <Link to="/services" className="premium-button premium-button-ghost px-6 py-3 text-sm">
                                Browse services
                            </Link>
                        </div>
                    </GlassCard>
                </Reveal>
            </div>
        </PageShell>
    );
}