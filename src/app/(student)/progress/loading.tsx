export default function ProgressLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 w-44 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-3 w-28 bg-white/[0.04] rounded mt-1.5 animate-pulse" />
        </div>
        <div className="h-10 w-10 bg-white/[0.06] rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 bg-white/[0.04] rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
