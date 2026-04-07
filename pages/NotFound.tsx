import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { appRoutes } from '../lib/routes';

const NotFound: React.FC = () => {
  const { locale } = useLocale();
  const location = useLocation();

  useEffect(() => {
    document.title = locale === 'zh' 
      ? '找不到页面 - Foodmax' 
      : 'Page Not Found - Foodmax';
  }, [locale]);

  const copy = locale === 'zh' ? {
    errorCode: '404',
    title: '页面未找到',
    subtitle: '抱歉，您访问的页面不存在或已被移除。',
    url: '请求的地址：',
    backToHome: '返回首页',
    contactSupport: '联系我们'
  } : {
    errorCode: '404',
    title: 'Page Not Found',
    subtitle: 'Sorry, the page you are looking for does not exist or has been moved.',
    url: 'Requested URL: ',
    backToHome: 'Back to Home',
    contactSupport: 'Contact Support'
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-500">
      <div className="max-w-xl w-full space-y-10 text-center relative z-10">
        
        {/* Decorative background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-foodmax-forest/5 rounded-full blur-3xl -z-10" />

        <div className="mx-auto flex items-center justify-center h-28 w-28 rounded-full bg-white shadow-xl border border-gray-100">
          <ShieldAlert className="h-12 w-12 text-foodmax-forest" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-[6rem] leading-none font-black text-gray-900 tracking-tighter drop-shadow-sm">
            {copy.errorCode}
          </h2>
          <p className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            {copy.title}
          </p>
          <p className="text-lg text-gray-500 font-medium max-w-md mx-auto">
            {copy.subtitle}
          </p>
          <p className="text-xs bg-gray-100 text-gray-400 font-mono py-2 px-4 rounded-lg inline-block w-full max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {copy.url} {location.pathname}
          </p>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4 border-t border-gray-200">
          <Link
            to={appRoutes.home}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-transparent text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-foodmax-forest/20 text-white bg-foodmax-forest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all hover:-translate-y-1"
          >
            <Home size={16} /> {copy.backToHome}
          </Link>
          <Link
            to={appRoutes.contact}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-xs font-black uppercase tracking-[0.2em] rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-foodmax-forest hover:text-foodmax-forest transition-all group"
          >
            {copy.contactSupport} <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
