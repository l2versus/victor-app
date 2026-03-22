export default function MessagesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-5 w-32 bg-white/[0.04] rounded-lg" />
        <div className="h-3 w-44 bg-white/[0.03] rounded-lg" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
          <div className="w-8 h-8 rounded-full bg-white/[0.04] shrink-0" />
          <div className={`h-16 rounded-2xl bg-white/[0.03] ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
        </div>
      ))}
    </div>
  )
}
