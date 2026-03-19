import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/* ═══ INPUT ═══ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-sm text-white placeholder:text-neutral-500 transition-all duration-200",
          "hover:border-neutral-700",
          "focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

/* ═══ TEXTAREA ═══ */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-white placeholder:text-neutral-500 transition-all duration-200 resize-y",
          "hover:border-neutral-700",
          "focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

/* ═══ SELECT ═══ */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 pr-10 text-sm text-white transition-all duration-200 cursor-pointer",
            "hover:border-neutral-700",
            "focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&>option]:bg-neutral-900 [&>option]:text-white",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Input, Textarea, Select }
