import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <input
        className={`
          w-full rounded-xl border border-gray-200 bg-gray-50
          px-4 py-3 text-sm text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:border-blue-400 focus:bg-white
          transition-colors
          ${className}
        `}
        {...rest}
      />
    </div>
  )
}
