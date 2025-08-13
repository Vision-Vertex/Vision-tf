import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 dark:border-primary/30 dark:bg-primary/20 dark:text-primary-foreground",
        secondary:
          "border-secondary/20 bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 dark:border-secondary/30 dark:bg-secondary/20",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/20",
        outline: "border-border bg-background/50 text-foreground backdrop-blur-sm",
        success: "border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
        premium: "border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 hover:from-purple-500/20 hover:to-blue-500/20 dark:text-purple-400",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
