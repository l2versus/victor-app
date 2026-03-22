export default function NutritionLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-5 w-28 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-44 bg-white/[0.03] rounded-lg" />
      </div>
      {/* Macros ring skeleton */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full bg-white/[0.04]" />
        <div className="grid grid-cols-3 gap-4 w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-5 w-10 mx-auto bg-white/[0.04] rounded-lg" />
              <div className="h-3 w-14 mx-auto bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Meal cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="h-4 w-24 bg-white/[0.04] rounded-lg" />
          <div className="h-3 w-full bg-white/[0.03] rounded-lg" />
          <div className="h-3 w-3/4 bg-white/[0.03] rounded-lg" />
        </div>
      ))}
    </div>
  )
}
