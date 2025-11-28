"use client"

import * as React from "react"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerOverlay,
  DrawerClose,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/base/Drawer"
import { cn } from "@/lib/utils"

export const RightDrawer = () => {
  return (
    <Drawer direction="right">
      {/* Trigger Button */}
      <DrawerTrigger asChild>
        <button className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-medium">
          <span>(VND đ)</span>
          <span className="text-gray-500">- VN</span>
          <span className="ml-1 text-gray-400">&gt;</span>
        </button>
      </DrawerTrigger>

      {/* Overlay */}
      <DrawerOverlay className="bg-black/20 " />

      {/* Drawer Content */}
      <DrawerContent
        side="right"
        width="16rem"
        className={cn(
          " bg-white border-l p-6 flex flex-col",
        )}
      >
        <DrawerHeader>
          <DrawerTitle>Chose Language</DrawerTitle>
          <DrawerDescription>Explore our sections</DrawerDescription>
        </DrawerHeader>

        <nav className="flex-1 mt-6 flex flex-col gap-4">
          {/* Navigation items */}
        </nav>

        <DrawerFooter>
          <DrawerClose className="mt-auto px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default RightDrawer
