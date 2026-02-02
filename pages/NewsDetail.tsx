
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Printer, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { news } = useData();
  const article = news.find(n => n.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Insight Not Found</h1>
        <button onClick={() => navigate('/news')} className="px-8 py-3 bg-foodmax-forest text-white rounded-xl font-bold">Return to Archive</button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      {/* Article Header Metadata */}
      <div className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/news" className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-foodmax-forest transition-colors uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Insights
          </Link>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-foodmax-forest transition-colors"><Share2 size={18} /></button>
            <button className="p-2 text-gray-400 hover:text-foodmax-forest transition-colors" onClick={() => window.print()}><Printer size={18} /></button>
          </div>
        </div>
      </div>

      <article className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Metadata */}
          <div className="flex items-center gap-4 mb-8">
            <span className="px-3 py-1 bg-foodmax-forest/10 text-foodmax-forest text-[10px] font-black uppercase tracking-widest rounded-full">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <Clock size={14} /> 4 Min Read
            </div>
            <span className="text-xs font-bold text-gray-400">•</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{article.date}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-[900] text-gray-900 mb-10 leading-[1.15] tracking-tight">
            {article.title}
          </h1>

          <div className="aspect-video w-full overflow-hidden rounded-3xl mb-16 border border-gray-100 shadow-xl">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Body Content */}
          <div className="prose prose-lg max-w-none">
            {article.content.map((paragraph, idx) => (
              <p key={idx} className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 font-medium">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-foodmax-forest flex items-center justify-center text-white font-black">FM</div>
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Foodmax Trade Desk</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Market Analysis Division</p>
              </div>
            </div>
            <div className="flex gap-4">
               <Link to="/contact" className="px-8 py-3 bg-foodmax-forest text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foodmax-lime hover:text-foodmax-forest transition-all shadow-lg">
                  Discuss this insight
               </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="bg-gray-50 py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-gray-900 mb-12 uppercase tracking-widest">Related Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.filter(n => n.id !== id).slice(0, 3).map(related => (
              <Link key={related.id} to={`/news/${related.id}`} className="group block">
                 <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-6 border border-gray-200 shadow-sm group-hover:shadow-lg transition-all">
                    <img src={related.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>
                 <h4 className="text-lg font-black text-gray-900 group-hover:text-foodmax-forest transition-colors leading-tight">{related.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsDetail;
