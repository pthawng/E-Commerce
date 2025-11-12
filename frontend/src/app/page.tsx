import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Welcome to My E-Commerce</h1>
        <p className="text-lg text-gray-600">
          This is the starting point for our Next.js frontend.
        </p>
        <p>You can start by exploring the <Link href="/shop" className="text-blue-500 hover:underline">Shop</Link> page.</p>
      </div>
    </main>
  );
}
