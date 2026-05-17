import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { translations, LanguageCode } from '../translations';

interface Scheme {
  scheme_name: string;
  documents_required: string[];
}

interface DocumentVaultProps {
  schemes: Scheme[];
  lang: LanguageCode;
  onClose: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ schemes, lang, onClose }) => {
  const t = (translations as any)[lang];
  
  // Aggregate unique documents across all matched schemes
  const allDocs = Array.from(new Set(schemes.flatMap(s => s.documents_required)));
  
  const [completed, setCompleted] = React.useState<Record<string, boolean>>({});

  const toggleDoc = (doc: string) => {
    setCompleted(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  const completionRate = Math.round((Object.values(completed).filter(Boolean).length / allDocs.length) * 100) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-natural-text/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-natural-base w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 md:p-10 bg-white border-b border-natural-secondary relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-natural-muted hover:text-natural-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yojana-green/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-yojana-green" />
            </div>
            <h2 className="text-2xl font-serif font-medium">{t.myWallet}</h2>
          </div>
          <p className="text-sm text-natural-muted font-medium mb-6">{t.walletSubtitle}</p>
          
          <div className="w-full h-3 bg-natural-secondary/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              className="h-full bg-yojana-green"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{completionRate}% Ready for Application</span>
            {completionRate === 100 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-yojana-green uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> All Set!
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-4">
          {allDocs.map((doc, idx) => (
            <button
              key={idx}
              onClick={() => toggleDoc(doc)}
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                completed[doc] 
                  ? "bg-yojana-green/5 border-yojana-green/20" 
                  : "bg-white border-natural-secondary hover:border-yojana-green/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                  completed[doc] ? "bg-yojana-green text-white" : "bg-natural-base text-natural-muted group-hover:bg-yojana-green/10"
                )}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className={cn(
                    "block font-bold text-sm mb-0.5",
                    completed[doc] ? "text-yojana-green" : "text-mud-text"
                  )}>
                    {doc}
                  </span>
                  <p className="text-[10px] text-natural-muted uppercase tracking-widest font-bold">
                    Required for {schemes.filter(s => s.documents_required.includes(doc)).length} match(es)
                  </p>
                </div>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                completed[doc] ? "bg-yojana-green border-yojana-green scale-110" : "border-natural-secondary"
              )}>
                {completed[doc] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="p-8 bg-white border-t border-natural-secondary">
          <p className="text-[10px] text-center text-natural-muted uppercase font-bold tracking-widest">
            Documents marked here are saved locally for your session.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
