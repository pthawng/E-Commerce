"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"

type FlexibleDrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  width?: string | number
  height?: string | number
  side?: "left" | "right" | "top" | "bottom"
}

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/20 transition-opacity",
      "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & FlexibleDrawerProps
>(
  ({ className, children, width = "16rem", height = "100vh", side = "left", ...props }, ref) => {
    // class side
    const sideClasses = {
      left: "left-0 top-0 h-full border-r transform -translate-x-full data-[state=open]:translate-x-0",
      right: "right-0 top-0 h-full border-l transform translate-x-full data-[state=open]:translate-x-0",
      top: "top-0 left-0 w-full border-b transform -translate-y-full data-[state=open]:translate-y-0",
      bottom: "bottom-0 left-0 w-full border-t transform translate-y-full data-[state=open]:translate-y-0",
    }

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          ref={ref}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
          }}
          className={cn(
            "fixed z-50 bg-background flex flex-col transition-transform duration-300 ease-in-out",
            sideClasses[side],
            className
          )}
          {...props}
        >
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    )
  }
)
DrawerContent.displayName = "DrawerContent"

// Header / Footer / Title / Description
const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
