import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

type NumericInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  allowDecimal?: boolean
  allowNegative?: boolean
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ allowDecimal = true, allowNegative = false, onChange, onKeyDown, onPaste, ...props }, ref) => {
    const sanitize = (value: string) => {
      let v = value.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, "")
      if (allowNegative) {
        const negative = v.startsWith("-")
        v = (negative ? "-" : "") + v.slice(negative ? 1 : 0).replace(/-/g, "")
      }
      if (allowDecimal) {
        const firstDot = v.indexOf(".")
        if (firstDot !== -1) {
          v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "")
        }
      } else {
        v = v.replace(/\./g, "")
      }
      return v
    }

    return (
      <Input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        ref={ref}
        onKeyDown={(e) => {
          if (
            e.key.length === 1 &&
            !/[0-9]/.test(e.key) &&
            !(allowDecimal && e.key === "." && !e.currentTarget.value.includes(".")) &&
            !(allowNegative && e.key === "-" && e.currentTarget.selectionStart === 0 && !e.currentTarget.value.includes("-")) &&
            !e.ctrlKey &&
            !e.metaKey
          ) {
            e.preventDefault()
          }
          onKeyDown?.(e)
        }}
        onPaste={(e) => {
          onPaste?.(e)
        }}
        onChange={(e) => {
          const sanitized = sanitize(e.target.value)
          if (sanitized !== e.target.value) {
            e.target.value = sanitized
          }
          onChange?.(e)
        }}
        {...props}
      />
    )
  }
)
NumericInput.displayName = "NumericInput"

export { Input, NumericInput }
