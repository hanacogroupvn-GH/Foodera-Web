
import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  // White text for use over a dark photo background (e.g. category header images).
  light?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, centered = true, light = false }) => {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : 'text-left'}`}>
      <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      {subtitle && <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${light ? 'text-white/85' : 'text-gray-600'}`}>{subtitle}</p>}
      <div className={`h-1.5 w-24 bg-foodera-lime mt-8 rounded-full ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
};

export default SectionHeading;
