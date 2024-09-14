"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      " flex touch-none select-none flex-col items-center justify-start",
      orientation === "horizontal" ? "h-5 w-full" : "h-full w-5 flex-col",
      className,
    )}
    orientation={orientation}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        orientation === "horizontal" ? "h-2 w-full" : "h-full w-2",
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          "absolute bg-blue-300 dark:bg-slate-50",
          orientation === "horizontal" ? "h-full" : "w-full",
        )}
      />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb
      className={cn(
        "relative flex cursor-grab justify-center rounded-full border-2 focus-visible:outline-none active:cursor-grabbing",
        orientation === "horizontal" ? "h-4 w-4 active:h-6 active:w-6" : "",
      )}
    >
      <div
        onPointerDown={(e: any) => {
          // prevent thumb from moving on click
          e.stopPropagation()
          const newEvent = new PointerEvent("pointerdown", e)
          e.currentTarget.parentElement?.dispatchEvent(newEvent)
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 transition-colors duration-200 "
      >
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 3H11M1 5H11M1 7H11"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
