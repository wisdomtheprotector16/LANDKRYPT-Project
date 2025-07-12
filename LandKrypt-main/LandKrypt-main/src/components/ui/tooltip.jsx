import * as React from "react"
import { cn } from "../../lib/utils"

const Tooltip = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
Tooltip.displayName = "Tooltip"

export { Tooltip }