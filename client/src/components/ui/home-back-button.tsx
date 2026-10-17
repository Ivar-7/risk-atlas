import { ArrowLeft } from 'lucide-react'
import { Button } from './button'

export function HomeBackButton() {
  return (
    <Button
      asChild
      variant="outline"
      className="group absolute left-4 top-4 z-20 h-10 overflow-hidden rounded-md border-white/20 bg-card/90 pl-11 pr-4 text-sm text-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring sm:left-6 sm:top-6"
    >
      <a href="/" aria-label="Back to home">
        <span aria-hidden="true" className="transition-opacity duration-500 group-hover:opacity-0 motion-reduce:transition-none">Home</span>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-1 left-1 grid w-8 place-items-center rounded-sm bg-white/10 transition-[width,transform] duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 motion-reduce:transition-none">
          <ArrowLeft size={16} strokeWidth={2} />
        </span>
      </a>
    </Button>
  )
}
