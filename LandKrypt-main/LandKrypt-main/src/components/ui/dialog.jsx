import * as React from "react"
import { cn } from "../../lib/utils"

const Dialog = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
Dialog.displayName = "Dialog"

export { Dialog }