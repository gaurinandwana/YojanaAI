import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  Download, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  FileText,
  X,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { translations, LanguageCode } from '../translations';

interface Scheme {
  scheme_name: string;
  ministry: string;
  category: string;
  eligibility_match_score: number;
  why_this_matches: string;
  eligibility_bullets: string[];
  missing_eligibility_factors: string[];
  benefits: string[];
  income_limit: string;
  eligible_categories: string[];
  education_requirement: string;
  official_source: string;
  application_process: string;
  state: string;
  deadline: string;
  documents_required: string[];
}

interface SchemeDetailsProps {
  scheme: Scheme;
  lang: LanguageCode;
  onClose: () => void;
}

export const SchemeDetails: React.FC<SchemeDetailsProps> = ({ scheme, lang, onClose }) => {
  const t = (translations as any)[lang];
  const [checkedEligibility, setCheckedEligibility] = useState<Record<number, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleEligibility = (idx: number) => {
    setCheckedEligibility(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getDocTooltip = (doc: string) => {
    const tips: Record<string, string> = {
      "Aadhaar Card": "Available at UIDAI website or nearest Aadhaar Seva Kendra.",
      "Income Certificate": "Issued by Tahsildar/Revenue Department. Can be applied online via e-District.",
      "Caste Certificate": "Issued by competent authority like SDM/Tahsildar.",
      "Land Records": "Available on State Bhulekh portal (e.g., AnyRoR, MeeBhoomi).",
      "Bank Account": "Can be opened at any nationalized or private bank with KYC.",
      "Passport Size Photo": "Recently taken color photographs required.",
      "Ration Card": "Issued by Food & Civil Supplies Department."
    };
    return tips[doc] || "Contact your local Tehsil or Common Service Centre (CSC) for details.";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-mud-text/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-bharat-khadi w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-white border border-natural-secondary rounded-full text-natural-muted hover:text-natural-text transition-colors shadow-sm z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-8 md:p-12 bg-white border-b border-natural-secondary">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-natural-accent bg-natural-accent/5 px-3 py-1.5 rounded-full border border-natural-accent/10">
                   {scheme.category}
                </span>
                <div className="px-4 py-1.5 bg-natural-primary text-white text-[10px] font-bold rounded-full ml-auto uppercase tracking-widest shadow-sm">
                  {scheme.eligibility_match_score}% {lang === 'en' ? 'Match' : 'पात्रता'}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-mud-text">
                {scheme.scheme_name}
              </h1>
              <p className="text-sm font-black text-natural-muted mt-2 uppercase tracking-widest">{scheme.ministry}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10">
            {/* 1. Official Verification Badge */}
            <div className="bg-yojana-saffron/5 border border-yojana-saffron/20 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 bg-yojana-saffron/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yojana-saffron" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-yojana-saffron uppercase tracking-widest leading-none mb-2">{t.officialVerification}</h4>
                <p className="text-sm font-bold text-mud-text leading-relaxed">
                  {t.independentAssistantBanner}
                </p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-[10px] font-bold text-natural-muted uppercase">{t.sourceLabel}:</span>
                   <a 
                    href={scheme.official_source} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-bold text-yojana-saffron underline hover:text-yojana-saffron/80 flex items-center gap-1"
                   >
                    {new URL(scheme.official_source).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 1.5 Financial Benefit / Subsidy block (Mandatory Yojana AI Layout) */}
            <div className="bg-white rounded-3xl p-8 border border-natural-secondary shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yojana-green/10 rounded-xl flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <h3 className="text-lg font-bold text-mud-text">Financial Benefit / Subsidy</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-yojana-green/5 rounded-2xl border border-yojana-green/10">
                    <p className="text-[10px] font-bold text-yojana-green uppercase tracking-widest mb-1">Benefit Amount</p>
                    <p className="text-lg font-bold text-mud-text">{scheme.benefits[0] || 'Varies by application'}</p>
                  </div>
                  <div className="p-4 bg-yojana-green/5 rounded-2xl border border-yojana-green/10">
                    <p className="text-[10px] font-bold text-yojana-green uppercase tracking-widest mb-1">Type</p>
                    <p className="text-lg font-bold text-mud-text">Direct Benefit Transfer (DBT)</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-2">
                  <Info className="w-3 h-3 text-natural-muted" />
                  <p className="text-[10px] font-medium text-natural-muted italic">Actual amounts may vary based on verified land records or income certificates.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white rounded-3xl p-8 border border-natural-secondary shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 className="w-6 h-6 text-yojana-green" />
                  <h3 className="text-xl font-serif font-bold text-mud-text">{t.amIEligible}</h3>
                </div>
                <div className="space-y-4">
                  {scheme.eligibility_bullets.map((bullet, idx) => (
                    <button 
                      key={idx}
                      onClick={() => toggleEligibility(idx)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4",
                        checkedEligibility[idx] 
                          ? "bg-yojana-green/5 border-yojana-green/30" 
                          : "bg-bharat-khadi border-natural-secondary hover:border-yojana-green/30"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors",
                        checkedEligibility[idx] ? "bg-yojana-green border-yojana-green" : "border-natural-secondary bg-white"
                      )}>
                        {checkedEligibility[idx] && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={cn(
                        "text-[15px] font-bold leading-relaxed",
                        checkedEligibility[idx] ? "text-yojana-green line-through opacity-70" : "text-mud-text"
                      )}>
                        {bullet}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Required Documents Ledger */}
              <div className="bg-white rounded-3xl p-8 border border-natural-secondary shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-yojana-saffron" />
                  <h3 className="text-xl font-serif font-bold text-mud-text">{t.requiredDocuments}</h3>
                </div>
                <div className="grid gap-3">
                  {scheme.documents_required.map((doc, idx) => (
                    <div key={idx} className="group relative">
                      <div 
                        className="flex items-center justify-between p-5 bg-bharat-khadi rounded-2xl border border-natural-secondary/50 group-hover:border-yojana-green/30 transition-colors"
                        onMouseEnter={() => setActiveTooltip(doc)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <span className="text-xs font-black text-mud-text uppercase italic tracking-tight">{doc}</span>
                        <div className="p-1 text-natural-muted hover:text-yojana-green cursor-help transition-colors">
                          <Info className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {activeTooltip === doc && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full left-0 right-0 mb-4 p-5 bg-mud-text text-white text-[11px] rounded-[2rem] z-20 shadow-2xl border border-white/10"
                          >
                            <p className="font-black mb-2 uppercase tracking-widest text-white/40">{t.howToGetThis}</p>
                            <p className="font-bold leading-relaxed">{getDocTooltip(doc)}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Next Steps & Action Buttons */}
            <div className="space-y-6 pt-6 border-t border-natural-secondary/50">
               <div>
                 <h3 className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.2em] mb-4">{t.nextSteps}</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-yojana-green text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 shadow-xl shadow-yojana-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <Download className="w-7 h-7" />
                      <div className="text-left">
                        <span className="block leading-tight uppercase tracking-widest text-xs italic opacity-70">Action Required</span>
                        <span className="text-sm font-black uppercase tracking-tight">{t.downloadForm}</span>
                      </div>
                    </button>
                    <a 
                      href={`https://www.google.com/maps/search/Common+Service+Centre+near+me`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-white border-2 border-natural-secondary text-mud-text font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:border-yojana-green transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MapPin className="w-7 h-7 text-yojana-saffron" />
                      <div className="text-left">
                        <span className="block leading-tight uppercase tracking-widest text-xs italic opacity-70">Physical Support</span>
                        <span className="text-sm font-black uppercase tracking-tight">{t.locateCSC}</span>
                      </div>
                    </a>
                  </div>
               </div>

               <div className="bg-yojana-green/5 border border-yojana-green/10 rounded-2xl p-4 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-yojana-green" />
                  <p className="text-xs font-bold text-yojana-green">
                    Did you know? You can also apply via UMANG App for faster processing of {scheme.scheme_name}.
                  </p>
               </div>

               {/* Verified Source Footnote */}
               <div className="mt-8 pt-8 border-t border-natural-secondary/30">
                  <div className="bg-white rounded-3xl p-8 border border-yojana-green/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ShieldCheck className="w-24 h-24 text-yojana-green" />
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-yojana-green rounded-xl flex items-center justify-center shadow-lg shadow-yojana-green/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-mud-text flex items-center gap-2">
                          {t.verifiedShield}
                          <span className="w-1 h-1 bg-natural-muted rounded-full" />
                          <span className="text-[10px] text-natural-muted uppercase tracking-widest leading-none translate-y-[1px]">Footnote #1</span>
                        </h4>
                        <p className="text-xs text-natural-muted font-medium mt-1 italic">
                          {t.docVerified}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={scheme.official_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-yojana-green/5 hover:bg-yojana-green/10 text-yojana-green text-xs font-bold px-6 py-3 rounded-xl transition-all border border-yojana-green/10"
                    >
                      {t.viewSource}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
