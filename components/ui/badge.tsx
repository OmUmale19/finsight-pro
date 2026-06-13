import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      secondary: "bg-secondary/10 text-secondary",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      neutral: "bg-muted text-foreground"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
