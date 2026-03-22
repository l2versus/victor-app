export default function MachinesPreviewLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-5 w-40 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-48 bg-white/[0.03] rounded-lg" />
      </div>
      {/* 3D preview grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
        ))}
      </div>
    </div>
  )
}
