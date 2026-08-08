import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
}

export function SectionHeader({ title, subtitle, className, titleClassName }: SectionHeaderProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {subtitle && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-navy-soft">
          {subtitle}
        </span>
      )}
      <h2 className={cn("mt-3 font-serif text-3xl font-bold tracking-tight text-navy text-balance sm:text-4xl", titleClassName)}>
        {title}
      </h2>
      <div className="mt-4 h-1.5 w-24 rounded-full bg-[#F26522]" />
    </div>
  )
}
