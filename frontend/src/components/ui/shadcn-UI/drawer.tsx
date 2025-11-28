"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const DrawerShadcn = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
DrawerShadcn.displayName = "Drawer"

const DrawerTriggerShadcn = DrawerPrimitive.Trigger

const DrawerPortalShadcn = DrawerPrimitive.Portal

const DrawerCloseShadcn = DrawerPrimitive.Close
const DrawerOverlayShadcn = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/20", className)}
    {...props}
  />
))
DrawerOverlayShadcn.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContentShadcn = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortalShadcn>
    <DrawerOverlayShadcn />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortalShadcn>
))
DrawerContentShadcn.displayName = "DrawerContent"

const DrawerHeaderShadcn = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeaderShadcn.displayName = "DrawerHeader"

const DrawerFooterShadcn = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooterShadcn.displayName = "DrawerFooter"

const DrawerTitleShadcn = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitleShadcn.displayName = DrawerPrimitive.Title.displayName

const DrawerDescriptionShadcn = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescriptionShadcn.displayName = DrawerPrimitive.Description.displayName

export {
  DrawerShadcn,
  DrawerPortalShadcn,
  DrawerOverlayShadcn,
  DrawerTriggerShadcn,
  DrawerCloseShadcn,
  DrawerContentShadcn,
  DrawerHeaderShadcn,
  DrawerFooterShadcn,
  DrawerTitleShadcn,
  DrawerDescriptionShadcn,
}
