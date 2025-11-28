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
import { Menu } from "lucide-react"

const menuItems = [
  { title: "Home", href: "/" },
  { title: "Shop", href: "/shop" },
  { title: "Collections", href: "/collections" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
]

export const LeftDrawer = () => {
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <button className="p-2 rounded-md hover:bg-gray-200">
          <Menu className="h-6 w-6" />
        </button>
      </DrawerTrigger>

      <DrawerContent
        side="left"            // ← flexible, trượt từ trái
        width="16rem"          // ← width drawer
        className={cn("bg-white flex flex-col p-6")}
      >
        {/* Overlay được tự động thêm từ DrawerContent + DrawerOverlay */}
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription>Explore our sections</DrawerDescription>
        </DrawerHeader>

        <nav className="flex-1 mt-6 flex flex-col gap-4">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-lg font-medium hover:text-blue-600 transition-colors"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <DrawerFooter>
          <DrawerClose asChild>
            <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Close
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
