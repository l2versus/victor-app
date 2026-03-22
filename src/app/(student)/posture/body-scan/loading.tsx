export default function BodyScanLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-5 w-36 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-52 bg-white/[0.03] rounded-lg" />
      </div>
      {/* Camera preview skeleton */}
      <div className="aspect-[3/4] w-full rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
      {/* Capture button skeleton */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04]" />
      </div>
    </div>
  )
}
