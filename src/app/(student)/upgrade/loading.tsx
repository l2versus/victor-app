export default function UpgradeLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04]" />
        <div className="h-6 w-40 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-56 bg-white/[0.03] rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
          <div className="h-5 w-24 bg-white/[0.04] rounded-lg" />
          <div className="h-8 w-20 bg-white/[0.04] rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-full bg-white/[0.03] rounded-lg" />
            ))}
          </div>
          <div className="h-11 w-full bg-white/[0.04] rounded-xl" />
        </div>
      ))}
    </div>
  )
}
