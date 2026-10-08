import { Skeleton } from '@/components/ui/v-skeleton-8-utils/skeleton'

const primaryNavWidths = [60, 44, 52, 36]
const secondaryNavWidths = [48, 56]

export function Pattern() {
  return <div role="status" aria-label="Loading Risk Atlas dashboard" className="dashboard-theme flex min-h-screen w-full bg-bg text-text">
    <div className="hidden w-[260px] shrink-0 flex-col gap-1 border-r border-border bg-surface p-3 lg:flex">
      <div className="mb-4 flex items-center gap-3 px-2 py-2"><Skeleton className="size-8 rounded-md" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-2.5 w-28" /></div></div>
      {primaryNavWidths.map((width, index) => <div key={`primary-${width}-${index}`} className="flex items-center gap-2 rounded-md px-2.5 py-2"><Skeleton className="size-4 rounded-sm" /><Skeleton className="h-3.5" style={{ width: `${width}%` }} /></div>)}
      <div className="mt-5 border-t border-border/60 pt-4">
        {secondaryNavWidths.map((width) => <div key={width} className="flex items-center gap-2 rounded-md px-2.5 py-2"><Skeleton className="size-4 rounded-sm" /><Skeleton className="h-3.5" style={{ width: `${width}%` }} /></div>)}
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-2 pt-4"><Skeleton className="size-8 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div></div>
    </div>

    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-5 sm:px-7"><div className="flex items-center gap-3"><Skeleton className="size-5 rounded-sm" /><Skeleton className="h-4 w-28" /></div><div className="flex items-center gap-3"><Skeleton className="hidden h-8 w-40 sm:block" /><Skeleton className="size-8 rounded-full" /></div></div>
      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-5 px-5 py-7 sm:px-7 xl:px-9">
        <div className="space-y-3"><Skeleton className="h-3 w-36" /><Skeleton className="h-9 w-full max-w-[420px]" /><Skeleton className="h-4 w-full max-w-[540px]" /></div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="rounded-xl border border-border/70 bg-card p-5"><Skeleton className="h-3 w-32" /><Skeleton className="mt-3 h-6 w-48" /><Skeleton className="mt-3 h-3 w-full max-w-[360px]" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {['value', 'loss', 'locations', 'average'].map((key) => <div key={key} className="space-y-5 rounded-xl border border-border/70 bg-card p-5"><Skeleton className="h-3 w-28" /><Skeleton className="h-7 w-32" /><Skeleton className="h-3 w-40 max-w-full" /></div>)}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {['curve', 'reach'].map((key) => <div key={key} className="rounded-xl border border-border/70 bg-card p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-6 w-44" /><Skeleton className="mt-6 h-48 w-full rounded-lg" /></div>)}
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-5"><Skeleton className="mb-5 h-5 w-1/3" /><div className="space-y-3">{['first', 'second', 'third'].map((key) => <div key={key} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"><Skeleton className="size-8 rounded-md" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-40 max-w-full" /><Skeleton className="h-3 w-28 max-w-full" /></div><Skeleton className="h-5 w-14 rounded-full" /></div>)}</div></div>
      </div>
    </div>
  </div>
}

export default Pattern
