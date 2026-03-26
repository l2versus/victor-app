import { Skeleton, SkeletonStats } from "@/components/ui/skeleton"

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>
      <SkeletonStats count={4} />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
