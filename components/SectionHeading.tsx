
import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, centered = true }) => {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : 'text-left'}`}>
      <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">{title}</h2>
      {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
      <div className={`h-1.5 w-24 bg-foodmax-lime mt-8 rounded-full ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
};

export default SectionHeading;
