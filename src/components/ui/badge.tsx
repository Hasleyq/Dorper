import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        outline: 'text-foreground border-border',
        // Status variants
        active: 'border-transparent bg-emerald-50 text-emerald-700',
        sold: 'border-transparent bg-blue-50 text-blue-700',
        dead: 'border-transparent bg-zinc-100 text-zinc-600',
        // Sex variants
        male: 'border-transparent bg-sky-50 text-sky-700',
        female: 'border-transparent bg-pink-50 text-pink-700',
        // Alert variants
        warning: 'border-transparent bg-amber-50 text-amber-700',
        danger: 'border-transparent bg-red-50 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
