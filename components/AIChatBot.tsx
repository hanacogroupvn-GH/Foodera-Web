
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  Minus,
  Globe,
  ExternalLink,
  Info
} from 'lucide-react';
import { PRODUCTS } from '../constants';

interface Source {
  title: string;
  uri: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your Foodmax Virtual Export Assistant. I am now connected to global trade data streams. I can provide Foodmax technical specs or enrich our discussion with real-time market insights from the USDA, FAO, and international commodity exchanges. How can I assist your trade today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Custom Markdown Formatter for B2B Specs
  const formatMarkdown = (text: string) => {
    if (!text) return '';
    
    let formatted = text
      // Headers
      .replace(/### (.*?)(\n|$)/g, '<h4 class="text-sm font-black text-foodmax-forest uppercase tracking-wider mt-4 mb-2">$1</h4>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>')
      // Bullet points
      .replace(/^\* (.*?)(\n|$)/gm, '<li class="ml-4 mb-1 list-disc text-gray-600">$1</li>')
      // New lines
      .replace(/\n/g, '<br />');

    if (formatted.includes('<li')) {
      formatted = formatted.replace(/(<li.*<\/li>)/s, '<ul class="my-2">$1</ul>');
    }

    return formatted;
  };

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('toggle-foodmax-chat', handleToggle);
    return () => window.removeEventListener('toggle-foodmax-chat', handleToggle);
  }, []);

  const productContext = PRODUCTS.map(p => 
    `- ${p.name}: ${p.shortDescription}. Specs: ${JSON.stringify(p.specifications)}`
  ).join('\n');

  const systemInstruction = `
    You are the "Foodmax Virtual Export Assistant", a B2B intelligence agent.
    
    CORE MISSION:
    Combine Foodmax's internal export data with real-time global market intelligence to provide high-value trade support.
    
    INTERNAL KNOWLEDGE (FOODMAX):
    - Vietnam-based Agri-Exporter specializing in Rice, Coffee, and Cashews.
    - Quality: ISO 22000, HACCP, FDA.
    - Logistics: Ports (Cat Lai, Cai Mep, Hai Phong). Shipping to 30+ countries.
    - Product Details:
    ${productContext}
    
    EXTERNAL ENRICHMENT (USE SEARCH):
    1. Always use Google Search to provide context on:
       - Current commodity market prices (USDA, FAO, World Bank, ICE, NYBOT).
       - Global trade policy updates or import/export restrictions in key markets (GACC China, EU Food Safety, etc.).
       - Global crop yield forecasts and harvest timing.
    2. Be professional, technical, and data-driven.
    3. Use Markdown for structure.
    
    RULES:
    - Pricing is always market-indexed; refer quotes to export@foodmax.vn.
    - If data comes from an external source, summarize it professionally.
  `;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  const handleSend = async (customInput?: string) => {
    const messageToSend = customInput || input;
    if (!messageToSend.trim() || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Using gemini-3-flash-preview for speed + grounding capabilities
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: messageToSend }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
          temperature: 0.2, // Lower temperature for more factual B2B responses
        },
      });

      const responseText = response.text || "I apologize, I could not generate a response. Please reach out to our trade desk.";
      
      // Extract grounding chunks for source links
      const sources: Source[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri && chunk.web.title) {
            // Avoid duplicate sources
            if (!sources.find(s => s.uri === chunk.web.uri)) {
              sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          }
        });
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText,
        sources: sources.length > 0 ? sources : undefined
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Our trade intelligence node is currently recalibrating. For immediate technical specs, please contact us directly at export@foodmax.vn." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const QuickPrompts = [
    "Latest Coffee Market Trends",
    "Rice Export Prices 2024",
    "Vietnam Cashew Crop Yields",
    "EU Import Regulations"
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed right-6 bottom-6 w-[92vw] md:w-[420px] bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)] border border-gray-100 flex flex-col z-[1001] transition-all duration-300 overflow-hidden ${isMinimized ? 'h-[76px]' : 'h-[650px] max-h-[85vh]'}`}>
      {/* Header */}
      <div className="bg-foodmax-forest p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <Bot size={22} className="text-foodmax-lime" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Export Intelligence</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_#60a5fa]"></div>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
                Real-time Grounding Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-10">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#fcfdfc]">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                  msg.role === 'assistant' 
                  ? 'bg-white border-gray-100 text-foodmax-forest' 
                  : 'bg-foodmax-forest text-white border-transparent'
                }`}>
                  {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
                </div>
                <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 md:p-5 rounded-[1.5rem] text-[13px] md:text-sm leading-relaxed font-medium shadow-sm border ${
                    msg.role === 'assistant' 
                    ? 'bg-white text-gray-700 border-gray-100 rounded-tl-none' 
                    : 'bg-foodmax-forest text-white border-transparent rounded-tr-none'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} 
                        className="markdown-content"
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  {/* Sources Section */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 w-full animate-in fade-in slide-in-from-top-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Globe size={10} className="text-blue-500" /> Verified Market Sources
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {msg.sources.map((source, sIdx) => (
                          <a 
                            key={sIdx}
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-foodmax-forest hover:text-foodmax-lime transition-colors flex items-center justify-between group/link bg-white p-2 rounded-lg border border-gray-100"
                          >
                            <span className="truncate max-w-[85%]">{source.title}</span>
                            <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 text-foodmax-forest flex items-center justify-center shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-foodmax-lime" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enriching Data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-50 space-y-5">
            {/* Suggestion Chips */}
            {messages.length < 5 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {QuickPrompts.map((p) => (
                  <button 
                    key={p} 
                    onClick={() => handleSend(p)}
                    className="whitespace-nowrap px-4 py-2 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100 rounded-xl hover:bg-foodmax-lime/10 hover:border-foodmax-lime/40 hover:text-foodmax-forest transition-all active:scale-95"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Market trends, prices, or regs..."
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-foodmax-forest/20 focus:ring-4 focus:ring-foodmax-forest/5 text-sm font-medium pr-14 transition-all"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isTyping || !input.trim() ? 'bg-gray-100 text-gray-300' : 'bg-foodmax-forest text-white shadow-lg shadow-foodmax-forest/20 hover:scale-105 active:scale-95'}`}
              >
                <Send size={20} />
              </button>
            </div>
            
            <p className="text-[9px] text-gray-400 text-center uppercase tracking-[0.3em] font-black flex items-center justify-center gap-2">
              <Info size={10} /> Powered by Foodmax Origin Intelligence & Google Search
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatBot;
