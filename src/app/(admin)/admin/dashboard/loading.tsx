import { Skeleton, SkeletonStats } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="pt-1 sm:pt-2">
        <div className="flex items-center gap-3 sm:gap-4 mb-1">
          <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
      <SkeletonStats count={4} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}
