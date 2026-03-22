export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-6 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-3 w-48 bg-white/[0.04] rounded mt-2 animate-pulse" />
      </div>
      <div className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 text-center">
              <div className="h-3 w-8 bg-white/[0.06] rounded mx-auto animate-pulse" />
              <div className="h-5 w-5 bg-white/[0.08] rounded mt-1 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white/[0.02] animate-pulse" />
      </div>
    </div>
  )
}
