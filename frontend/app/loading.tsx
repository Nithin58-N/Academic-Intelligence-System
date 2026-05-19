export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass-card flex items-center justify-center animate-pulse">
          <span className="text-3xl">🎓</span>
        </div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
