import { ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

type GetStartedButtonProps = {
  href?: string
  label?: string
  compactLabel?: string
  variant?: 'primary' | 'outline'
  onLight?: boolean
}

export function GetStartedButton({
  href = '/dashboard/',
  label = 'Get Started',
  compactLabel = 'Start',
  variant = 'primary',
  onLight = false,
}: GetStartedButtonProps) {
  const outline = variant === 'outline'

  return (
    <Button
      asChild
      size="lg"
      className={cn(
        'group relative h-9 overflow-hidden rounded-md px-2.5 pr-9 text-xs font-medium transition-colors duration-200 max-[360px]:px-2 max-[360px]:pr-8 sm:h-10 sm:px-4 sm:pr-12 sm:text-sm',
        'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:ring-0 motion-reduce:transition-none',
        outline
          ? onLight
            ? 'border border-[#10294F]/25 bg-white text-[#10294F] hover:bg-[#F8FAFC] focus-visible:outline-[#D8184B]'
            : 'border border-white/45 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-white'
          : 'bg-[#D8184B] text-white hover:bg-[#C61645] focus-visible:outline-[#D8184B]',
      )}
    >
      <a href={href} aria-label={label} data-header-action>
        <span aria-hidden="true" className="transition-opacity duration-500 group-hover:opacity-0 motion-reduce:transition-none">
          <span className="sm:hidden">{compactLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-1 right-1 z-10 grid w-7 place-items-center rounded-sm transition-[width,transform] duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 max-[360px]:w-6 sm:w-9 motion-reduce:transition-none',
            outline ? onLight ? 'bg-[#10294F]/10' : 'bg-white/15' : 'bg-white/20',
          )}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </span>
      </a>
    </Button>
  )
}
