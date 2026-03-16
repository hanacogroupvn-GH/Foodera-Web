
import React from 'react';
import { ArrowUp, Bot, Sparkles } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

const FloatingContact: React.FC = () => {
  const { locale } = useLocale();
  const copy = locale === 'zh'
    ? {
        openAssistant: '打开 AI 助手',
        assistant: 'AI 出口助手',
        backToTop: '返回顶部'
      }
    : {
        openAssistant: 'Open AI Assistant',
        assistant: 'AI EXPORT ASSISTANT',
        backToTop: 'BACK TO TOP'
      };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleChat = () => {
    window.dispatchEvent(new CustomEvent('toggle-foodmax-chat'));
  };

  return (
    <div className="fixed right-4 sm:right-6 bottom-10 flex flex-col gap-3 z-[999] pointer-events-none animate-in fade-in slide-in-from-right-4 duration-1000">
      {/* AI Chat Bot Trigger */}
      <button
        onClick={toggleChat}
        aria-label={copy.openAssistant}
        className="group pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 bg-foodmax-forest text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-foodmax-lime hover:text-foodmax-forest transition-all duration-500 hover:scale-110 active:scale-90 border border-white/10 animate-float"
      >
        <Bot size={24} className="group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-4 px-3 py-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap shadow-2xl hidden sm:block pointer-events-none border border-white/10">
          {copy.assistant}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-t border-white/10"></div>
        </span>
        
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-foodmax-lime rounded-full border-2 border-foodmax-forest animate-pulse"></span>
      </button>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label={copy.backToTop}
        className="group pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 bg-white text-foodmax-forest rounded-2xl flex items-center justify-center shadow-xl hover:bg-gray-50 transition-all duration-500 hover:scale-110 active:scale-90 border border-gray-100"
      >
        <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform duration-300" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-4 px-3 py-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap shadow-2xl hidden sm:block pointer-events-none border border-white/10">
          {copy.backToTop}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-t border-white/10"></div>
        </span>
      </button>
    </div>
  );
};

export default FloatingContact;
