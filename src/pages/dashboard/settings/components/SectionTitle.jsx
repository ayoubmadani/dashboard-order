import React from 'react';

export default function SectionTitle({ children }) {
  return (
    <h3 className="text-base font-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">
      {children}
    </h3>
  );
}
