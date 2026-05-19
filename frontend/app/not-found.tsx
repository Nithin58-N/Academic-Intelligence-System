import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center glass-card p-8 max-w-md">
        <p className="text-6xl mb-4">404</p>
        <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-4">
          The page you are looking for does not exist.
        </p>
        <Link href="/dashboard" className="glass-button-primary inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
