export default function ProfileLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="w-20 h-20 rounded-full bg-white/[0.04]" />
        <div className="h-5 w-32 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-48 bg-white/[0.03] rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center space-y-2">
            <div className="h-6 w-10 mx-auto bg-white/[0.04] rounded-lg" />
            <div className="h-3 w-16 mx-auto bg-white/[0.03] rounded" />
          </div>
        ))}
      </div>

      {/* Menu items */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04]" />
            <div className="h-4 w-32 bg-white/[0.04] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
