import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
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
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { useLocale } from '../context/LocaleContext';
import { localizeProduct } from '../lib/contentLocalization';

interface Source {
  title: string;
  uri: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface AIChatBotProps {
  openRequestId?: number;
}

interface GroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMarkdown = (text: string) => {
  if (!text) return '';

  let formatted = escapeHtml(text)
    .replace(/### (.*?)(\n|$)/g, '<h4 class="text-sm font-black text-foodmax-forest uppercase tracking-wider mt-4 mb-2">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-gray-900">$1</strong>')
    .replace(/^\* (.*?)(\n|$)/gm, '<li class="ml-4 mb-1 list-disc text-gray-600">$1</li>')
    .replace(/\n/g, '<br />');

  if (formatted.includes('<li')) {
    formatted = formatted.replace(/(<li[\s\S]*<\/li>)/, '<ul class="my-2">$1</ul>');
  }

  return formatted;
};

const summarizeSpecifications = (product: Product) =>
  Object.entries(product.specifications)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

const buildLocalCatalogReply = (query: string, products: Product[], locale: 'en' | 'zh') => {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = products
    .filter((product) =>
      [
        product.name,
        product.category,
        product.subCategory,
        product.shortDescription,
        product.description
      ].some((field) => field.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, 3);

  if (matches.length === 0) {
    return locale === 'zh'
      ? [
          '当前环境尚未配置实时市场情报服务。',
          '### Foodmax 当前可用产品线',
          '* **大米** 出口系列',
          '* **咖啡** 出口系列',
          '* **腰果** 出口系列',
          '请输入产品名称、品类或子分类，我会从当前目录中为您检索。'
        ].join('\n')
      : [
          'Live market intelligence is not configured in this environment yet.',
          '### Available Foodmax portfolios',
          '* **Rice** export lines',
          '* **Coffee** export lines',
          '* **Cashew** export lines',
          'Mention a product name, category, or sub-category and I will search the current catalog.'
        ].join('\n');
  }

  return (
    locale === 'zh'
      ? [
          '当前环境未启用实时市场情报，但我仍可检索 Foodmax 现有产品目录。',
          '### 匹配到的目录产品',
          ...matches.map(
            (product) =>
              `* **${product.name}** - ${product.shortDescription}。规格：${summarizeSpecifications(product) || '详见产品页。'}`
          ),
          '如需完整技术信息，请打开产品页；如需价格，请联系出口团队。'
        ]
      : [
          'Live market intelligence is offline in this environment, but I can still search the current Foodmax catalog.',
          '### Matching catalog items',
          ...matches.map(
            (product) =>
              `* **${product.name}** - ${product.shortDescription}. Specs: ${summarizeSpecifications(product) || 'Available on product page.'}`
          ),
          'Open the product page for full details or contact the export desk for pricing.'
        ]
  ).join('\n');
};

const AIChatBot: React.FC<AIChatBotProps> = ({ openRequestId = 0 }) => {
  const { activeProducts: products } = useData();
  const { locale } = useLocale();
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  const hasLiveIntelligence = Boolean(geminiApiKey);
  const localizedProducts = useMemo(() => products.map((product) => localizeProduct(product, locale)), [locale, products]);
  const copy =
    locale === 'zh'
      ? {
          introLive: '您好，我是 Foodmax 虚拟出口助手。我可以回答产品目录问题，并在需要时补充实时市场背景。',
          introCatalog: '您好，我是 Foodmax 虚拟出口助手。当前环境未配置实时市场搜索，但我仍可帮助您浏览 Foodmax 当前目录。',
          noResponse: '暂时无法生成回复。若需立即支持，请联系 export@foodmax.vn。',
          serviceUnavailable: '实时情报服务暂时不可用。请稍后再试，或直接联系 export@foodmax.vn。',
          quickPrompts: ['查看大米产品', '查看咖啡产品', '查看腰果产品', '查找 ST25 香米'],
          quickPromptsLive: ['最新咖啡市场趋势', '2024 大米出口价格', '越南腰果产量', '欧盟进口法规'],
          title: '出口情报助手',
          liveSearch: '实时搜索已启用',
          catalogMode: '目录模式',
          expand: '展开助手',
          minimize: '最小化助手',
          close: '关闭助手',
          verifiedSources: '已核实市场来源',
          typingLive: '正在整合数据...',
          typingCatalog: '正在检索目录...',
          placeholder: '市场趋势、价格或产品线...',
          send: '发送消息',
          footerLive: '由 Foodmax 目录与 Google 搜索支持',
          footerCatalog: '由 Foodmax 目录支持',
          systemInstruction: '请以简体中文回答，保持专业、直接，并优先使用当前产品目录中的事实。'
        }
      : {
          introLive:
            'Hello! I am your Foodmax Virtual Export Assistant. I can answer catalog questions and enrich them with live market context when needed.',
          introCatalog:
            'Hello! I am your Foodmax Virtual Export Assistant. Live market search is not configured here, but I can still help you browse the current Foodmax catalog.',
          noResponse: 'I could not generate a response. Please contact export@foodmax.vn for immediate assistance.',
          serviceUnavailable:
            'The live intelligence service is temporarily unavailable. Please try again or contact export@foodmax.vn for direct support.',
          quickPrompts: ['Show rice products', 'Show coffee products', 'Show cashew products', 'Find ST25 rice'],
          quickPromptsLive: ['Latest Coffee Market Trends', 'Rice Export Prices 2024', 'Vietnam Cashew Crop Yields', 'EU Import Regulations'],
          title: 'Export Intelligence',
          liveSearch: 'Live search active',
          catalogMode: 'Catalog mode',
          expand: 'Expand assistant',
          minimize: 'Minimize assistant',
          close: 'Close assistant',
          verifiedSources: 'Verified Market Sources',
          typingLive: 'Enriching data...',
          typingCatalog: 'Searching catalog...',
          placeholder: 'Market trends, prices, or catalog lines...',
          send: 'Send message',
          footerLive: 'Powered by Foodmax Catalog and Google Search',
          footerCatalog: 'Powered by Foodmax Catalog',
          systemInstruction: 'Respond in English unless the user explicitly requests another language.'
        };

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: hasLiveIntelligence ? copy.introLive : copy.introCatalog
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openRequestId > 0) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [openRequestId]);

  const productContext = useMemo(
    () =>
      localizedProducts
        .map(
          (product) =>
            `- ${product.name}: ${product.shortDescription}. Specs: ${JSON.stringify(product.specifications)}`
        )
        .join('\n'),
    [localizedProducts]
  );

  const systemInstruction = useMemo(
    () => `
      You are the "Foodmax Virtual Export Assistant", a B2B intelligence agent.

      CORE MISSION:
      Combine Foodmax's internal export data with live market context to provide useful trade support.

      INTERNAL KNOWLEDGE (FOODMAX):
      - Vietnam-based agri-exporter specializing in Rice, Coffee, and Cashews.
      - Quality: ISO 22000, HACCP, FDA-aligned export operations.
      - Logistics: Ports include Cat Lai, Cai Mep, and Hai Phong. Shipping to 30+ countries.
      - Product Details:
      ${productContext}

      RESPONSE RULES:
      - Be direct, technical, and commercially useful.
      - Use markdown for structure.
      - Never invent exact prices or claims not present in the catalog or live sources.
      - If pricing is requested, explain that quotes are market-indexed and should be confirmed with export@foodmax.vn.
      - If external live context is used, cite the grounded sources returned by the tool.
      - ${copy.systemInstruction}
    `,
    [copy.systemInstruction, productContext]
  );

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: hasLiveIntelligence ? copy.introLive : copy.introCatalog
      }
    ]);
  }, [copy.introCatalog, copy.introLive, hasLiveIntelligence]);

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
    setMessages((prev) => [...prev, { role: 'user', content: messageToSend }]);
    setIsTyping(true);

    try {
      if (!geminiApiKey) {
        const localReply = buildLocalCatalogReply(messageToSend, localizedProducts, locale);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        setMessages((prev) => [...prev, { role: 'assistant', content: localReply }]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: messageToSend }] }],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          temperature: 0.2
        }
      });

      const responseText =
        response.text || copy.noResponse;

      const sources: Source[] = [];
      const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
      chunks.forEach((chunk) => {
        const title = chunk.web?.title?.trim();
        const uri = chunk.web?.uri?.trim();
        if (!title || !uri) return;
        if (!sources.find((source) => source.uri === uri)) {
          sources.push({ title, uri });
        }
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
          sources: sources.length > 0 ? sources : undefined
        }
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            copy.serviceUnavailable
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = hasLiveIntelligence ? copy.quickPromptsLive : copy.quickPrompts;

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-6 bottom-6 z-[1001] flex w-[92vw] flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        isMinimized ? 'h-[76px]' : 'h-[650px] max-h-[85vh]'
      } md:w-[420px]`}
    >
      <div className="relative shrink-0 overflow-hidden bg-foodmax-forest p-5">
        <div className="absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md">
              <Bot size={22} className="text-foodmax-lime" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">{copy.title}</h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasLiveIntelligence
                      ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'
                      : 'bg-foodmax-lime shadow-[0_0_8px_rgba(140,198,63,0.8)]'
                  }`}
                />
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/50">
                  {hasLiveIntelligence ? copy.liveSearch : copy.catalogMode}
                </span>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((current) => !current)}
              className="rounded-xl p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              aria-label={isMinimized ? copy.expand : copy.minimize}
            >
              <Minus size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              aria-label={copy.close}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-grow overflow-y-auto bg-[#fcfdfc] p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${
                      message.role === 'assistant'
                        ? 'border-gray-100 bg-white text-foodmax-forest'
                        : 'border-transparent bg-foodmax-forest text-white'
                    }`}
                  >
                    {message.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
                  </div>
                  <div className={`flex max-w-[85%] flex-col gap-2 ${message.role === 'user' ? 'items-end' : ''}`}>
                    <div
                      className={`rounded-[1.5rem] border p-4 text-[13px] font-medium leading-relaxed shadow-sm md:p-5 md:text-sm ${
                        message.role === 'assistant'
                          ? 'rounded-tl-none border-gray-100 bg-white text-gray-700'
                          : 'rounded-tr-none border-transparent bg-foodmax-forest text-white'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                          className="markdown-content"
                        />
                      ) : (
                        message.content
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="w-full animate-in rounded-2xl border border-gray-100 bg-gray-50 p-3 fade-in slide-in-from-top-1">
                        <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                          <Globe size={10} className="text-blue-500" /> {copy.verifiedSources}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {message.sources.map((source) => (
                            <a
                              key={source.uri}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/link flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2 text-[10px] font-bold text-foodmax-forest transition-colors hover:text-foodmax-lime"
                            >
                              <span className="max-w-[85%] truncate">{source.title}</span>
                              <ExternalLink size={10} className="opacity-0 transition-opacity group-hover/link:opacity-100" />
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-foodmax-forest shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex items-center gap-2 rounded-[1.5rem] rounded-tl-none border border-gray-100 bg-white p-4 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-foodmax-lime" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {hasLiveIntelligence ? copy.typingLive : copy.typingCatalog}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="space-y-5 border-t border-gray-50 bg-white p-6">
            {messages.length < 5 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void handleSend(prompt)}
                    className="whitespace-nowrap rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:border-foodmax-lime/40 hover:bg-foodmax-lime/10 hover:text-foodmax-forest active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="group relative">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={copy.placeholder}
                className="w-full rounded-2xl border border-transparent bg-gray-50 px-6 py-4 pr-14 text-sm font-medium outline-none transition-all focus:border-foodmax-forest/20 focus:bg-white focus:ring-4 focus:ring-foodmax-forest/5"
              />
              <button
                onClick={() => void handleSend()}
                disabled={isTyping || !input.trim()}
                className={`absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl transition-all ${
                  isTyping || !input.trim()
                    ? 'bg-gray-100 text-gray-300'
                    : 'bg-foodmax-forest text-white shadow-lg shadow-foodmax-forest/20 hover:scale-105 active:scale-95'
                }`}
                aria-label={copy.send}
              >
                <Send size={20} />
              </button>
            </div>

            <p className="flex items-center justify-center gap-2 text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
              <Info size={10} />
              {hasLiveIntelligence ? copy.footerLive : copy.footerCatalog}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatBot;
