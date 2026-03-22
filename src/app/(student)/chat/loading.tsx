export default function ChatLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-24 bg-white/[0.04] rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
          <div className="w-8 h-8 rounded-full bg-white/[0.04] shrink-0" />
          <div className={`h-14 rounded-2xl bg-white/[0.03] ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
        </div>
      ))}
    </div>
  )
}
