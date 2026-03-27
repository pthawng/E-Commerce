import React from 'react';
import { motion } from 'framer-motion';
import { SidebarNav } from '@/features/profile/components/SidebarNav';


interface ProfileLayoutProps {
  children: React.ReactNode;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface pt-32 pb-20 px-6 sm:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-24">
          {/* Sidebar */}
          <aside className="w-full md:w-1/4">
            <SidebarNav />
          </aside>

          {/* Main Content */}
          <main className="w-full md:w-3/4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};
