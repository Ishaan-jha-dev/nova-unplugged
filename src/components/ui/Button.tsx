import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-nova-primary text-white hover:bg-nova-primary-light shadow-glow-sm hover:shadow-glow-purple',
  accent:
    'bg-nova-accent text-white hover:bg-nova-accent-light hover:shadow-glow-pink',
  outline:
    'bg-transparent text-nova-primary border border-nova-primary/50 hover:bg-nova-primary/10 hover:border-nova-primary',
  ghost:
    'bg-transparent text-nova-text-dim hover:text-nova-text hover:bg-white/5',
  danger:
    'bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
  success:
    'bg-nova-success/20 text-nova-success border border-nova-success/40 hover:bg-nova-success/30',
  warning:
    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 hover:shadow-[0_0_16px_rgba(234,179,8,0.3)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2',
  xl: 'px-8 py-4 text-lg rounded-xl gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200',
          'cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'xl' ? 20 : 16} />
        ) : (
          icon
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
