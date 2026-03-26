import { Skeleton } from "@/components/ui/skeleton"

export default function WorkoutsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
