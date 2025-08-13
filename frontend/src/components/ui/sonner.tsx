"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-card-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-500/10 group-[.toaster]:text-green-600 dark:group-[.toaster]:text-green-400",
          error:
            "group-[.toaster]:border-destructive/20 group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive",
          warning:
            "group-[.toaster]:border-yellow-500/20 group-[.toaster]:bg-yellow-500/10 group-[.toaster]:text-yellow-600 dark:group-[.toaster]:text-yellow-400",
          info: "group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-500/10 group-[.toaster]:text-blue-600 dark:group-[.toaster]:text-blue-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
