import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Styled <select> matching our light theme
// ============================================
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-border bg-white text-slate-900 px-3 py-1.5 text-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'appearance-none cursor-pointer',
      // Custom arrow
      'bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat',
      "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")]",
      error && 'border-red-500 focus:ring-red-500/30 focus:border-red-500',
      className
    )}
    style={{ colorScheme: 'light' }}
    {...props}
  >
    {children}
  </select>
))
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
