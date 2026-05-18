import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  User, 
  MapPin, 
  IndianRupee, 
  Info, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Stethoscope,
  Briefcase,
  Sprout,
  Heart,
  Users,
  Mic,
  Globe,
  X,
  Tractor,
  Home,
  Store,
  HandHeart,
  Hammer,
  School,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Check,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import formOptions from './data/formOptions.json';
import { translations, LanguageCode } from './translations';
import { SchemeDetails } from './components/SchemeDetails';
import { DocumentVault } from './components/DocumentVault';
import { YojanaAIChat } from './components/YojanaAIChat';

import logo from './assets/logo.png';

const { STATES, CASTES, EDUCATION_LEVELS, INCOME_RANGES, OCCUPATIONS } = formOptions;

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

const POPULAR_CATEGORIES = [
  { id: 'agriculture', label: 'Kisan / Farming', icon: Tractor, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'education', label: 'Student Scholarships', icon: GraduationCap, color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'health', label: 'Medical Support', icon: Stethoscope, color: 'bg-red-50 text-red-700 border-red-100' },
  { id: 'social', label: 'Pension & Ration', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { id: 'business', label: 'Loans & Business', icon: Store, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'women', label: 'Women & Girls', icon: HandHeart, color: 'bg-pink-50 text-pink-700 border-pink-100' },
  { id: 'employment', label: 'Jobs & Skills', icon: Hammer, color: 'bg-natural-primary/5 text-natural-primary border-natural-primary/10' },
  { id: 'housing', label: 'Housing Support', icon: Home, color: 'bg-orange-50 text-orange-700 border-orange-100' },
];

export default function App() {
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = translations[lang] as any;

  const POPULAR_CATEGORIES = [
    { id: 'agriculture', label: t.categoryAgriculture, icon: Tractor, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { id: 'education', label: t.categoryEducation, icon: GraduationCap, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { id: 'health', label: t.categoryHealth, icon: Stethoscope, color: 'bg-red-50 text-red-700 border-red-100' },
    { id: 'social', label: t.categorySocial, icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { id: 'business', label: t.categoryBusiness, icon: Store, color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { id: 'women', label: t.categoryWomen, icon: HandHeart, color: 'bg-pink-50 text-pink-700 border-pink-100' },
    { id: 'employment', label: t.categoryEmployment, icon: Hammer, color: 'bg-natural-primary/5 text-natural-primary border-natural-primary/10' },
    { id: 'housing', label: t.categoryHousing, icon: Home, color: 'bg-orange-50 text-orange-700 border-orange-100' },
  ];

  const [step, setStep] = useState<'welcome' | 'profile' | 'purpose' | 'results'>('welcome');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [nlResponse, setNlResponse] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Scheme[]>([]);
  const [rejectedSchemes, setRejectedSchemes] = useState<{name: string, reason: string}[]>([]);
  const [uncertainSchemes, setUncertainSchemes] = useState<{name: string, reason: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    educationLevel: '',
    caste: '',
    familyIncome: '',
    occupation: '',
    disabilityStatus: '',
    state: '',
    isMinority: '',
    residency: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const togglePurpose = (id: string) => {
    setSelectedPurposes(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = ['gender', 'educationLevel', 'caste', 'state', 'occupation', 'familyIncome', 'residency'];
    const missing = requiredFields.filter(f => !profile[f as keyof typeof profile]);
    if (missing.length > 0) {
      setError(`Please complete all selections to continue.`);
      return;
    }
    setError(null);
    setStep('purpose');
  };
  
  const handleNLParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    
    setParsing(true);
    setError(null);
    try {
      const response = await fetch('/api/parse-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlQuery }),
      });
      if (!response.ok) throw new Error('Failed to parse query');
      const data = await response.json();
      
      setProfile(prev => ({
        ...prev,
        state: data.state || prev.state,
        familyIncome: data.familyIncome || prev.familyIncome,
        caste: data.caste || prev.caste,
        gender: data.gender || prev.gender,
        educationLevel: data.educationLevel || prev.educationLevel,
        occupation: data.occupation || prev.occupation,
        age: data.age || prev.age,
      }));
      setNlResponse(data.friendly_response);
      setStep('profile');
    } catch (err) {
      setError("I couldn't quite understand that. Please use the form or try another way.");
    } finally {
      setParsing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (selectedPurposes.length === 0) {
      setError("Please select at least one purpose to find relevant schemes.");
      return;
    }

    setLoading(true);
    setStep('results');
    setError(null);
    setRecommendations([]);
    setRejectedSchemes([]);
    setUncertainSchemes([]);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, purposes: selectedPurposes, language: lang }),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data.eligible_schemes || []);
      setRejectedSchemes(data.rejected_schemes || []);
      setUncertainSchemes(data.uncertain_schemes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'mr-IN';
    recognition.interimResults = true;

    setShowVoiceModal(true);
    setIsListening(true);
    setVoiceText('');

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setVoiceText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setShowVoiceModal(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    (window as any)._recognition = recognition;
  };

  const finishVoice = () => {
    if ((window as any)._recognition) {
      (window as any)._recognition.stop();
    }
    setIsListening(false);
    setNlQuery(voiceText);
    setTimeout(() => {
      setShowVoiceModal(false);
      // Automatically trigger search after voice input if text exists
      if (voiceText.trim()) {
        const fakeEvent = { preventDefault: () => {} } as any;
        handleNLParse(fakeEvent);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-natural-base text-natural-text font-sans selection:bg-natural-accent/20">
      {/* Header */}
      <header className="bg-natural-white/50 backdrop-blur-sm border-b border-natural-secondary sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105" onClick={() => setStep('welcome')}>
            <div className="w-10 h-10 bg-yojana-green rounded-xl flex items-center justify-center shadow-lg shadow-yojana-green/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-none text-mud-text">{t.yojanaAIName}</h2>
              <p className="text-[9px] font-bold text-natural-muted uppercase tracking-[0.2em] mt-1">{t.yojanaAISubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white border border-natural-secondary px-3 py-1.5 rounded-full text-xs font-bold text-natural-muted hover:border-natural-primary transition-all">
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-natural-secondary rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
                <button onClick={() => setLang('en')} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-natural-primary/5 transition-colors">English</button>
                <button onClick={() => setLang('hi')} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-natural-primary/5 transition-colors border-t border-natural-secondary/50">हिन्दी</button>
                <button onClick={() => setLang('ta')} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-natural-primary/5 transition-colors border-t border-natural-secondary/50">தமிழ்</button>
                <button onClick={() => setLang('mr')} className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-natural-primary/5 transition-colors border-t border-natural-secondary/50">मराठी</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center py-6 md:py-12"
            >
              <div className="w-full max-w-4xl text-center flex flex-col items-center mb-10 md:mb-16">
                <div className="flex justify-center mb-10">
                   <div className="w-24 h-24 bg-yojana-green text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-yojana-green/30 relative group">
                      <ShieldCheck className="w-12 h-12" />
                      <div className="absolute -bottom-2 -right-2 bg-yojana-saffron text-white p-2 rounded-xl shadow-lg transform transition-transform group-hover:scale-110">
                        <Sparkles className="w-5 h-5" />
                      </div>
                   </div>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-black text-mud-text leading-[1.1] tracking-tight mb-8">
                  {t.welcome}
                </h1>
                <p className="text-lg md:text-xl text-natural-muted font-medium mb-12 max-w-2xl px-6 leading-relaxed">
                  {t.hindiSub} <br className="hidden md:block" />
                  <span className="opacity-70 text-[10px] italic font-black tracking-[0.3em] uppercase mt-4 block">{t.example}</span>
                </p>

                <div className="w-full max-w-3xl relative px-4 group">
                  <div className="bg-white border-2 border-natural-secondary rounded-[2.5rem] p-3 md:p-3 shadow-2xl shadow-yojana-green/5 focus-within:border-yojana-green/50 transition-all">
                    <form onSubmit={handleNLParse} className="flex flex-col md:flex-row items-center gap-3 w-full">
                      <div className="flex-1 flex items-center w-full">
                        <div className="pl-6">
                          <Search className="w-6 h-6 text-natural-muted" />
                        </div>
                        <input 
                          type="text" 
                          value={nlQuery}
                          onChange={(e) => setNlQuery(e.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="w-full bg-transparent border-none px-4 py-5 focus:outline-none text-lg font-bold text-mud-text placeholder:text-natural-muted/50 placeholder:font-medium"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button 
                          type="button"
                          onClick={startVoice}
                          className="p-5 bg-natural-base text-yojana-green rounded-full hover:bg-yojana-green/10 transition-colors"
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                        <button 
                          type="submit"
                          disabled={parsing}
                          className="flex-1 md:flex-none bg-yojana-green text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-yojana-green/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {parsing ? t.analyzing : t.searchButton}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-4xl px-4">
                <div className="flex items-center justify-between mb-8 px-2">
                   <h2 className="text-[11px] font-black font-sans uppercase tracking-[0.4em] text-natural-muted">{t.popularCategories}</h2>
                   <div className="h-px flex-1 bg-natural-secondary ml-8 opacity-20" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {POPULAR_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => { togglePurpose(cat.id); setStep('profile'); }}
                        className={cn(
                          "flex flex-col items-start gap-4 p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.03] active:scale-95 shadow-sm text-left group min-h-[180px]",
                          cat.color
                        )}
                      >
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7" />
                        </div>
                        <span className="font-serif font-bold text-base leading-tight tracking-tight text-mud-text">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-16 w-full p-8 bg-natural-secondary/10 rounded-[3rem] border border-natural-secondary/30 text-center">
                <p className="text-xs font-bold text-natural-muted uppercase tracking-widest mb-4">{t.directBenefits}</p>
                <button 
                  onClick={() => setStep('profile')}
                  className="inline-flex items-center gap-2 text-natural-primary font-bold hover:underline underline-offset-4"
                >
                  {t.manualProfile}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 items-start"
            >
              {/* Form Side */}
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-natural-secondary relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <ShieldCheck className="w-32 h-32 text-mud-text" />
                </div>
                {nlResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 p-6 bg-yojana-green/5 border border-yojana-green/20 rounded-3xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ClipboardList className="w-12 h-12" />
                    </div>
                    <p className="text-[13px] text-mud-text font-bold italic leading-relaxed">
                      " {nlResponse} "
                    </p>
                  </motion.div>
                )}
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-natural-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yojana-green/10 rounded-xl flex items-center justify-center text-yojana-green">
                      <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-mud-text">{t.step1}</h2>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-natural-muted">{t.identityDetails}</span>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-5">
                    <label className="block">
                      <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.fullName}</span>
                      <input 
                        type="text" 
                        name="name" 
                        required
                        value={profile.name}
                        onChange={handleChange}
                        placeholder={lang === 'hi' ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                        className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:ring-4 focus:ring-yojana-green/5 focus:border-yojana-green/30 transition-all"
                      />
                    </label>

                    <div className="grid grid-cols-[1fr_2fr] gap-4">
                      <label className="block">
                        <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.age}</span>
                        <input 
                          type="number" 
                          name="age" 
                          required
                          value={profile.age}
                          onChange={handleChange}
                          placeholder="21"
                          className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.gender}</span>
                        <div className="relative">
                          <select 
                            name="gender" 
                            value={profile.gender}
                            onChange={handleChange}
                            className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none"
                          >
                            <option value="" disabled>{t.selectGender}</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.caste}</span>
                        <div className="relative">
                          <select 
                            name="caste" 
                            value={profile.caste}
                            onChange={handleChange}
                            className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none"
                          >
                            <option value="" disabled>{t.selectCaste}</option>
                            {CASTES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.state}</span>
                        <div className="relative">
                          <select name="state" value={profile.state} onChange={handleChange} className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none">
                            <option value="" disabled>{t.selectState}</option>
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                        </div>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.education}</span>
                      <div className="relative">
                        <select name="educationLevel" value={profile.educationLevel} onChange={handleChange} className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none">
                          <option value="" disabled>{t.selectEducation}</option>
                          {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.occupation}</span>
                      <div className="relative">
                        <select name="occupation" value={profile.occupation} onChange={handleChange} className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl px-5 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none">
                          <option value="" disabled>{t.selectOccupation}</option>
                          {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] block mb-2 leading-none">{t.familyIncome}</span>
                      <div className="relative">
                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-yojana-green" />
                        <select name="familyIncome" value={profile.familyIncome} onChange={handleChange} className="w-full bg-bharat-khadi border border-natural-secondary rounded-2xl pl-14 pr-12 py-4 font-bold text-mud-text focus:outline-none focus:border-yojana-green/30 appearance-none">
                          <option value="" disabled>{t.selectIncome}</option>
                          {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted rotate-90 pointer-events-none" />
                      </div>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                      <div className="flex items-center justify-between p-5 bg-bharat-khadi rounded-2xl border border-natural-secondary/50">
                        <span className="text-xs font-black uppercase text-mud-text tracking-widest">{t.minorityStatus}</span>
                        <select name="isMinority" value={profile.isMinority} onChange={handleChange} className="bg-transparent text-xs font-black text-yojana-green focus:outline-none">
                          <option value="" disabled>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-bharat-khadi rounded-2xl border border-natural-secondary/50">
                        <span className="text-xs font-black uppercase text-mud-text tracking-widest">{t.disability}</span>
                        <select name="disabilityStatus" value={profile.disabilityStatus} onChange={handleChange} className="bg-transparent text-xs font-black text-yojana-green focus:outline-none">
                          <option value="" disabled>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="pt-6">
                    <button 
                      type="submit" 
                      className="w-full bg-yojana-green text-white font-black uppercase tracking-[0.2em] py-5 rounded-full shadow-2xl shadow-yojana-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                      Continue to Purpose
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>
              </section>

              {/* Info Side */}
              <div className="hidden lg:flex flex-col justify-center gap-16 py-12 px-12">
                <div className="space-y-8">
                  <h2 className="text-6xl font-serif font-black text-mud-text leading-[1.1] tracking-tight">
                    Authorized <span className="text-yojana-green">Eligibility</span> <br/>Discovery Engine.
                  </h2>
                  <p className="text-natural-muted text-xl max-w-md italic leading-relaxed font-medium">
                    By providing your demographic details, our secure analysis engine matches you against thousands of Central and State schemes.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-natural-secondary relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <h4 className="text-4xl font-black text-yojana-green">1.4B</h4>
                    <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em] mt-3">Verified Citizens</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-natural-secondary relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <h4 className="text-4xl font-black text-yojana-green">99%</h4>
                    <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em] mt-3">Matching Precision</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'purpose' && (
            <motion.div 
              key="purpose"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-16">
                 <div className="bg-yojana-green/10 text-yojana-green px-4 py-2 rounded-full inline-flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{t.step2}</span>
                 </div>
                <h2 className="text-5xl md:text-6xl font-serif font-black text-mud-text mt-4 leading-tight">{t.intentQuestion}</h2>
                <p className="text-natural-muted mt-4 text-xl font-medium max-w-2xl mx-auto italic">{t.narrowResults}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {POPULAR_CATEGORIES.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPurposes.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePurpose(p.id)}
                      className={cn(
                        "p-10 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-6 relative overflow-hidden group min-h-[220px]",
                        isSelected 
                          ? "border-yojana-green bg-yojana-green/5 shadow-2xl shadow-yojana-green/10" 
                          : "border-natural-secondary bg-white hover:border-yojana-green/30"
                      )}
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", p.color)}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl text-mud-text leading-tight mb-2">{p.label}</h3>
                        <p className="text-xs text-natural-muted font-bold uppercase tracking-widest opacity-60">Verified Sector</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-6 right-6">
                           <div className="w-6 h-6 bg-yojana-green text-white rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4" />
                           </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-8">
                <button 
                  onClick={handleFinalSubmit}
                  className="bg-yojana-green text-white px-16 py-6 rounded-full font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-yojana-green/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                >
                  Analyze Eligibility
                  <Sparkles className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-6">
                  <button onClick={() => setStep('profile')} className="text-[11px] font-black uppercase tracking-widest text-natural-muted hover:text-mud-text transition-colors flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Correct Details
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 border-b-4 border-yojana-green/10 pb-12">
                <div className="flex-1 space-y-4">
                  <div className="bg-yojana-green/10 text-yojana-green px-3 py-1 rounded-full inline-flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{t.eligible} Analysis Complete</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-serif font-black text-mud-text leading-tight">{t.forYou}, {profile.name.split(' ')[0]}</h1>
                  <p className="text-lg text-natural-muted font-medium italic max-w-2xl">{t.analyzedSummary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => setShowWallet(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white border-2 border-yojana-green/20 hover:border-yojana-green text-yojana-green px-8 py-4 rounded-full font-black shadow-xl shadow-yojana-green/5 transition-all group"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-[0.2em]">{t.myWallet}</span>
                  </button>
                  <button 
                    onClick={() => { setStep('profile'); setSelectedPurposes([]); setRecommendations([]); }}
                    className="text-[10px] font-black text-natural-muted hover:text-mud-text px-4 py-2 transition-colors uppercase tracking-[0.3em]"
                  >
                    {t.startOver}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="space-y-10">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-[3rem] p-12 border border-natural-secondary animate-pulse shadow-inner">
                      <div className="flex justify-between mb-8">
                         <div className="h-4 bg-natural-base rounded w-1/4"></div>
                         <div className="h-10 w-10 bg-natural-base rounded-xl"></div>
                      </div>
                      <div className="h-12 bg-natural-base rounded w-3/4 mb-10"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="h-32 bg-natural-base rounded-3xl"></div>
                        <div className="h-32 bg-natural-base rounded-3xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex gap-6 items-center">
                  <AlertCircle className="text-red-900 w-10 h-10" />
                  <div>
                    <h4 className="text-red-900 font-bold text-lg">Analysis Disrupted</h4>
                    <p className="text-red-800 text-sm mt-1 font-medium leading-relaxed">{error}</p>
                    <button onClick={handleFinalSubmit} className="mt-4 text-xs font-bold text-red-900 border-b-2 border-red-900">RETRY SEARCH</button>
                  </div>
                </div>
              )}

              <div className="grid gap-12">
                <AnimatePresence>
                  {!loading && recommendations.length === 0 && !error && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="bg-natural-white rounded-[3rem] p-16 text-center border-2 border-dashed border-natural-secondary"
                    >
                      <div className="w-20 h-20 bg-natural-base rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="text-natural-muted w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-serif font-medium text-natural-text mb-4">No exact schemes found</h3>
                      <p className="text-natural-muted font-medium italic max-w-md mx-auto leading-relaxed">
                        We couldn't find schemes that match your exact eligibility criteria at the moment. 
                        Try adjusting your profile or checking back later as new Yojanas are added.
                      </p>
                      {rejectedSchemes.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-natural-secondary/50 text-left">
                          <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-6">Eligibility Exclusions ({rejectedSchemes.length})</h4>
                          <div className="grid gap-4">
                            {rejectedSchemes.slice(0, 3).map((rs, i) => (
                              <div key={i} className="flex gap-4 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-200 mt-2 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-natural-text/80">{rs.name}</p>
                                  <p className="text-[10px] text-natural-muted italic leading-relaxed">{rs.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                   </div>
                 )}
               </motion.div>
             )}

             {recommendations.map((scheme, idx) => (
                    <motion.div 
                      key={scheme.scheme_name}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedScheme(scheme)}
                      className="group bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl shadow-yojana-green/5 border border-natural-secondary hover:border-yojana-green/50 transition-all relative overflow-hidden cursor-pointer active:scale-[0.99] group"
                    >
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-all group-hover:scale-110 pointer-events-none">
                         <ShieldCheck className="w-48 h-48" />
                      </div>

                      {/* Badge Area */}
                      <div className="flex flex-wrap items-center gap-3 mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yojana-saffron bg-yojana-saffron/10 px-4 py-2 rounded-full border border-yojana-saffron/20">
                           {scheme.category} Welfare
                        </span>
                        <div className="px-5 py-2 bg-yojana-green text-white text-[10px] font-black rounded-full ml-auto uppercase tracking-[0.2em] shadow-lg shadow-yojana-green/20">
                          {scheme.eligibility_match_score}% Authorization Score
                        </div>
                      </div>

                      <div className="space-y-4 mb-10 relative z-10">
                        <h4 className="text-[11px] font-black text-yojana-green uppercase tracking-[0.4em] mb-2">{scheme.ministry}</h4>
                        <h3 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-mud-text leading-tight group-hover:text-yojana-green transition-colors">
                          {scheme.scheme_name}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mb-10 overflow-hidden">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-mud-text uppercase bg-bharat-khadi px-4 py-2.5 rounded-2xl border border-natural-secondary/50">
                          <MapPin className="w-3.5 h-3.5 text-yojana-green" /> {scheme.state} Authority
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-mud-text uppercase bg-bharat-khadi px-4 py-2.5 rounded-2xl border border-natural-secondary/50">
                          <Info className="w-3.5 h-3.5 text-yojana-green" /> {scheme.deadline !== "All" ? scheme.deadline : 'Open Year-Round'}
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-mud-text uppercase bg-bharat-khadi px-4 py-2.5 rounded-2xl border border-natural-secondary/50">
                          <IndianRupee className="w-3.5 h-3.5 text-yojana-green" /> {scheme.income_limit} Income Limit
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-12 mb-12 border-y border-natural-secondary/50 py-12 relative z-10">
                        <div>
                          <h4 className="text-[11px] font-black text-natural-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                             <Sparkles className="w-4 h-4 text-yojana-saffron" /> Core Benefits
                          </h4>
                          <ul className="space-y-5">
                            {scheme.benefits.map((item, i) => (
                              <li key={i} className="text-[15px] font-bold flex items-start gap-4 text-mud-text leading-relaxed">
                                <div className="w-2 h-2 rounded-full bg-yojana-green mt-2.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-natural-muted uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                             <ClipboardList className="w-4 h-4 text-yojana-green" /> Document Checklist
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {scheme.documents_required.map((doc, i) => (
                              <div key={i} className="flex items-center gap-4 bg-bharat-khadi p-4 rounded-2xl border border-natural-secondary/50 font-bold text-xs text-mud-text group/item hover:border-yojana-green/30 transition-colors">
                                <div className="w-5 h-5 rounded-lg border-2 border-natural-secondary flex items-center justify-center flex-shrink-0 group-hover/item:border-yojana-green/50">
                                   <Check className="w-3 h-3 text-yojana-green opacity-0 group-hover/item:opacity-100" />
                                </div>
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-bharat-khadi rounded-[2.5rem] p-8 md:p-12 mb-12 border border-yojana-green/10 grid lg:grid-cols-[1.5fr_1fr] gap-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                           <ShieldCheck className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-[11px] font-black text-yojana-green uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5" /> Eligibility Report
                          </h4>
                          <ul className="space-y-4">
                            {scheme.eligibility_bullets.map((bullet, i) => (
                              <li key={i} className="text-sm font-bold text-mud-text flex items-start gap-3 leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-yojana-green mt-2 flex-shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col justify-center space-y-6 relative z-10">
                          <div className="p-6 bg-white rounded-3xl border border-natural-secondary/50 font-medium text-sm text-mud-text/80 leading-relaxed italic shadow-inner">
                             "{scheme.why_this_matches}"
                          </div>
                          {scheme.missing_eligibility_factors.length > 0 && (
                            <div className="p-6 bg-red-50/50 border border-red-100 rounded-3xl">
                              <h5 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Discrepancy Risk
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {scheme.missing_eligibility_factors.map((factor, i) => (
                                  <span key={i} className="text-[10px] font-black bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl uppercase tracking-tighter shadow-sm">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6 relative z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedScheme(scheme); }}
                          className="flex-[2] bg-yojana-green text-white text-center py-6 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-yojana-green/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          View Verification Steps & Apply
                        </button>
                        <div className="flex-1 bg-bharat-khadi border border-natural-secondary p-1.5 rounded-[1.5rem] flex items-center pr-6">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm border border-natural-secondary/50">
                            <ShieldCheck className="w-6 h-6 text-yojana-green" />
                          </div>
                          <div className="flex-1 shrink min-w-0">
                            <p className="text-[10px] font-black text-mud-text/50 uppercase tracking-[0.1em] leading-none mb-1">Source Gateway</p>
                            <p className="text-xs font-black text-mud-text truncate uppercase">{new URL(scheme.official_source).hostname.replace('www.', '')}</p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1.5 text-[9px] font-black text-yojana-green uppercase bg-white px-3 py-1.5 rounded-lg ml-4 border border-yojana-green/10 shadow-sm">
                             {t.verifiedShield}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {uncertainSchemes.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest border-b border-natural-secondary pb-4">Potential Matches (Experimental)</h4>
                    <div className="grid gap-6">
                      {uncertainSchemes.map((us, i) => (
                        <div key={i} className="bg-white/50 border border-natural-secondary p-6 rounded-2xl flex items-start gap-4">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-natural-text">{us.name}</h5>
                            <p className="text-xs text-natural-muted italic mt-1 font-medium">{us.reason}</p>
                            <p className="text-[9px] font-bold text-amber-600 uppercase mt-2">I am not confident about this recommendation.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {recommendations.length > 0 && (
                  <div className="h-32 border-2 border-dashed border-natural-secondary rounded-[3rem] flex items-center justify-center text-natural-muted text-sm font-medium italic opacity-60">
                    Discovering local municipal and state-level add-ons...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        {!showChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 z-40 bg-yojana-green text-white p-5 rounded-full shadow-2xl shadow-yojana-green/40 flex items-center gap-3 group"
          >
            <div className="flex flex-col items-end mr-2 hidden md:flex">
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-80">Ask Yojana AI</span>
              <span className="text-xs font-bold leading-tight">Yojana AI Assistant</span>
            </div>
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}

        {/* Voice Modal Overlay */}
        <AnimatePresence>
          {showChat && (
            <YojanaAIChat 
              lang={lang}
              onClose={() => setShowChat(false)}
            />
          )}
          {showWallet && (
            <DocumentVault 
              schemes={recommendations}
              lang={lang}
              onClose={() => setShowWallet(false)}
            />
          )}
          {selectedScheme && (
            <SchemeDetails 
              scheme={selectedScheme}
              lang={lang}
              onClose={() => setSelectedScheme(null)}
            />
          )}
          {showVoiceModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-natural-text/90 backdrop-blur-md"
            >
              <button 
                onClick={() => setShowVoiceModal(false)}
                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="w-full max-w-md text-center">
                <div className="mb-12">
                  <div className="relative w-32 h-32 mx-auto">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-natural-primary rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 bg-natural-primary rounded-full"
                    />
                    <div className="absolute inset-0 bg-natural-primary rounded-full flex items-center justify-center shadow-2xl">
                      <Mic className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-serif font-medium text-white mb-4">
                  {isListening ? t.listening : t.done}
                </h2>
                <p className="text-white/60 text-lg mb-12">
                  {lang === 'hi' ? "(आप बोलिये)" : `(${t.aapBoliye})`}
                </p>

                <div className="bg-white/10 rounded-3xl p-8 mb-12 min-h-[120px] flex items-center justify-center">
                  <p className="text-xl text-white font-medium leading-relaxed italic">
                    {voiceText || "..."}
                  </p>
                </div>

                <button 
                  onClick={finishVoice}
                  className="bg-white text-natural-text font-bold px-12 py-4 rounded-full text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  {t.done}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-natural-white/50 border-t border-natural-secondary py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-natural-muted font-bold uppercase tracking-widest">
            © 2026 YojanaAI • Serving the Billion
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-natural-muted">
          </div>
        </div>
      </footer>
    </div>
  );

}
