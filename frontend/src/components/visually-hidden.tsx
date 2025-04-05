// components/ui/visually-hidden.tsx
import { cn } from "@/lib/utils";
import * as React from "react";

// Remove the empty interface and use the type directly
const VisuallyHidden = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(
                "absolute h-[1px] w-[1px] overflow-hidden whitespace-nowrap p-0",
                "border-0 [clip:rect(0_0_0_0)] [overflow-wrap:normal]",
                className
            )}
            {...props}
        />
    );
});
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };