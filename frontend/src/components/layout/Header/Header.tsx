"use client";

import { useEffect, useState } from "react";
import { RightSection } from "@/components/layout/Header/RightSection";
import { LeftSection } from "@/components/layout/Header/LeftSection";
import { Logo } from "@/components/base/Logo";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State để kiểm tra đã cuộn chưa

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      // Nếu cuộn quá 50px thì đổi trạng thái
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm text-black py-3" // Khi cuộn: Nền trắng mờ, chữ đen
          : "bg-transparent text-white py-5" // Khi ở đỉnh: Trong suốt, chữ trắng (như ảnh bạn gửi)
      }`}
    >
      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        
        {/* Left Section */}
        <div className="flex items-center z-10">
          <LeftSection />
        </div>

        {/* Center - Logo (Luôn căn giữa tuyệt đối) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Bạn có thể cần truyền prop màu vào Logo để đổi màu logo theo nền */}
          <Logo color={isScrolled ? "black" : "white"} /> 
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4 z-10">
          <RightSection />
        </div>
      </div>
    </header>
  );
}