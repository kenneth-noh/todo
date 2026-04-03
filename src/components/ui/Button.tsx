import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={`
        rounded-xl font-medium transition-colors duration-150 select-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
