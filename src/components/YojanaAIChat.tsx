import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ShieldCheck, MessageSquare, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { translations, LanguageCode } from '../translations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    name: string;
    state: string;
    benefit: string;
    documents: string[];
    official_url?: string;
  };
}

const QUICK_ACTIONS = [
  { label: '🌾 Farmer Subsidies', query: 'Tell me about farming benefits and seed subsidies' },
  { label: '🎓 Student Scholarships', query: 'I want to know about student scholarships' },
  { label: '👵 Senior Pension', query: 'What are the pension schemes for senior citizens?' },
  { label: '🩺 Health Cover', query: 'Is there any free medical or health cover scheme?' },
];

interface YojanaAIChatProps {
  lang: LanguageCode;
  onClose: () => void;
}

export const YojanaAIChat: React.FC<YojanaAIChatProps> = ({ lang, onClose }) => {
  const t = (translations as any)[lang];
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: lang === 'hi' 
        ? "नमस्ते, मैं योजना एआई हूँ। मैं केवल सरकारी कल्याणकारी योजनाओं में आपकी मदद कर सकता हूँ।" 
        : "Namaste, I am Yojana AI. I am authorized only to assist you with Government Welfare Schemes." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, lang })
      });
      const data = await res.json();
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.text,
        metadata: data.scheme_metadata
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: 'err', 
        role: 'assistant', 
        content: "I am facing some connectivity issues. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-50 w-full md:w-[420px] h-full md:h-[700px] max-h-screen md:max-h-[85vh] flex flex-col bg-bharat-khadi rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-x border-t md:border border-natural-secondary overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-8 bg-yojana-green text-white flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg tracking-tight leading-none mb-1">Yojana AI Assistant</h3>
            <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest opacity-80">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Official Verification Engine
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-bharat-khadi scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col w-full",
                m.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "p-4 md:p-5 rounded-2xl text-[15px] shadow-sm max-w-[90%]",
                m.role === 'user' 
                  ? "bg-yojana-green text-white rounded-tr-none" 
                  : "bg-white text-mud-text border border-natural-secondary rounded-tl-none"
              )}>
                {m.role === 'assistant' ? (
                  <div className="space-y-6">
                    <div className="prose prose-sm max-w-none prose-emerald leading-relaxed font-medium">
                      <Markdown>{m.content}</Markdown>
                    </div>
                    
                    {m.metadata && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-bharat-khadi border border-yojana-green/20 rounded-3xl p-6 space-y-6 shadow-inner"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-2",
                              m.metadata.state === 'Central' ? "bg-yojana-saffron/10 text-yojana-saffron" : "bg-yojana-green/10 text-yojana-green"
                            )}>
                              {m.metadata.state} Welfare
                            </span>
                            <h4 className="font-serif font-bold text-lg text-mud-text leading-tight">{m.metadata.name}</h4>
                          </div>
                          <div className="w-10 h-10 bg-yojana-green rounded-xl flex items-center justify-center shadow-lg shadow-yojana-green/20">
                            <RefreshCcw className="w-5 h-5 text-white" />
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-natural-secondary flex items-center justify-between">
                          <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest leading-none">Primary Benefit</span>
                          <span className="text-sm font-black text-yojana-green">{m.metadata.benefit}</span>
                        </div>

                        <div>
                          <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest mb-3 px-1">Required Documents</p>
                          <div className="space-y-2">
                            {m.metadata.documents.map((doc, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-natural-secondary/50 group transition-colors hover:border-yojana-green/30">
                                <div className="w-4 h-4 rounded border-2 border-natural-secondary flex-shrink-0 group-hover:border-yojana-green/50" />
                                <span className="text-xs font-bold text-mud-text">{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {m.metadata.official_url && (
                          <a 
                            href={m.metadata.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-yojana-green text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-yojana-green/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            Get Official Portal Form
                          </a>
                        )}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <p className="font-bold leading-relaxed">{m.content}</p>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black text-natural-muted mt-2 opacity-50">
                {m.role === 'user' ? 'Citizen' : 'Yojana AI'}
              </span>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 p-4 bg-white border border-natural-secondary rounded-2xl w-32 items-center justify-center shadow-sm"
            >
              <Loader2 className="w-5 h-5 text-yojana-green animate-spin" />
              <span className="text-[10px] font-black text-yojana-green uppercase animate-pulse">Analyzing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <div className="p-4 md:p-6 bg-white border-t border-natural-secondary space-y-4 shadow-2xl relative z-20">
        {/* Quick actions chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide no-scrollbar">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(action.query)}
              className="whitespace-nowrap px-4 py-2 bg-bharat-khadi border border-natural-secondary rounded-full text-[11px] font-black text-mud-text hover:border-yojana-green/50 hover:bg-yojana-green/5 transition-all shadow-sm"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search Welfare Scheme..."
            className="flex-1 bg-bharat-khadi border border-natural-secondary rounded-full py-4 px-6 pr-16 text-sm font-bold text-mud-text focus:outline-none focus:border-yojana-green/50 focus:ring-4 focus:ring-yojana-green/5 transition-all placeholder:text-natural-muted"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-3.5 bg-yojana-green text-white rounded-full shadow-xl shadow-yojana-green/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-yojana-green" />
          <p className="text-[10px] text-natural-muted font-black uppercase tracking-[0.2em]">Verified Gateway</p>
        </div>
      </div>
    </motion.div>
  );
};
