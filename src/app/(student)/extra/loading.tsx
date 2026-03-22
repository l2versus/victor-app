export default function ExtraLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 w-40 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-3 w-52 bg-white/[0.04] rounded mt-1.5 animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-white/[0.06] rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
