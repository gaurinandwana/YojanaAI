import { useState } from 'react';
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
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import formOptions from './data/formOptions.json';

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

const PURPOSES = [
  { id: 'education', label: 'Education & Scholarships', icon: GraduationCap, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'health', label: 'Health & Medical Assistance', icon: Stethoscope, color: 'bg-red-50 text-red-600 border-red-100' },
  { id: 'business', label: 'Business & Loans', icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'agriculture', label: 'Agriculture & Farming', icon: Sprout, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'employment', label: 'Skill Development & Jobs', icon: Briefcase, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'social', label: 'Social Welfare & Pensions', icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { id: 'women', label: 'Women & Girl Child Empowerment', icon: Heart, color: 'bg-pink-50 text-pink-600 border-pink-100' },
];

export default function App() {
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
        body: JSON.stringify({ ...profile, purposes: selectedPurposes }),
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

  return (
    <div className="min-h-screen bg-natural-base text-natural-text font-sans selection:bg-natural-accent/20">
      {/* Header */}
      <header className="bg-natural-white/50 backdrop-blur-sm border-b border-natural-secondary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => setStep('welcome')}>
            <img src={logo} alt="YojanaAI Logo" className="h-10 w-auto" />
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
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="max-w-3xl">
                <span className="text-[10px] font-bold text-natural-accent uppercase tracking-[0.3em] mb-6 block">Government Access Portal</span>
                <h1 className="text-6xl md:text-7xl font-serif font-medium text-natural-text leading-tight mb-8">
                  Your Path to <span className="text-natural-primary italic">Empowerment</span> & Welfare.
                </h1>
                <p className="text-xl text-natural-muted leading-relaxed mb-12 italic max-w-2xl mx-auto">
                  YojanaAI is a unified platform designed to help 1.4 billion citizens discover and access eligible government schemes with surgical precision. No more hunting through documents.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={() => setStep('profile')}
                    className="group bg-natural-primary text-white font-bold px-12 py-5 rounded-full shadow-2xl shadow-natural-primary/20 hover:scale-105 transition-all flex items-center gap-3 text-lg"
                  >
                    Discover Benefit Analysis
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center gap-3 text-natural-muted font-bold text-xs uppercase tracking-widest border border-natural-secondary/50 px-6 py-5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-natural-primary" />
                    Central & State Linked
                  </div>
                </div>

                <div className="mt-12 w-full max-w-xl mx-auto">
                  <div className="relative group">
                    <form onSubmit={handleNLParse}>
                      <input 
                        type="text" 
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        placeholder="Or just tell me: 'I am a girl student in Rajasthan...'"
                        className="w-full bg-white border-2 border-natural-secondary rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:ring-4 focus:ring-natural-primary/5 focus:border-natural-primary transition-all text-sm font-medium shadow-sm"
                      />
                      <button 
                        type="submit"
                        disabled={parsing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-natural-primary text-white rounded-xl flex items-center justify-center hover:bg-natural-primary/90 transition-all disabled:opacity-50"
                      >
                        {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      </button>
                    </form>
                  </div>
                  <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider mt-4">AI Extraction Powered Analysis</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24 w-full">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-natural-accent/5 rounded-2xl border border-natural-accent/10 flex items-center justify-center mx-auto">
                    <User className="w-6 h-6 text-natural-accent" />
                  </div>
                  <h4 className="font-bold text-lg">Personalized Matching</h4>
                  <p className="text-sm text-natural-muted leading-relaxed">Smarter algorithms that match your profile against thousands of records dynamically.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-natural-primary/5 rounded-2xl border border-natural-primary/10 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-6 h-6 text-natural-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Official Integration</h4>
                  <p className="text-sm text-natural-muted leading-relaxed">Direct links to official application gateways provided by Govt. of India.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-lg">State Directories</h4>
                  <p className="text-sm text-natural-muted leading-relaxed">Comprehensive coverage of regional welfare models unique to your home state.</p>
                </div>
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
              <section className="bg-natural-white rounded-3xl p-8 shadow-sm border border-natural-secondary">
                {nlResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 bg-natural-primary/5 border border-natural-primary/20 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ClipboardList className="w-12 h-12" />
                    </div>
                    <p className="text-sm text-natural-text font-medium italic leading-relaxed">
                      " {nlResponse} "
                    </p>
                  </motion.div>
                )}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-natural-primary" />
                    <h2 className="text-lg font-bold">Step 1: Your Profile</h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Identity Details</span>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Full Name</span>
                      <input 
                        type="text" 
                        name="name" 
                        required
                        value={profile.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-natural-primary/5 focus:border-natural-primary transition-all"
                      />
                    </label>

                    <div className="grid grid-cols-[1fr_2fr] gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Age</span>
                        <input 
                          type="number" 
                          name="age" 
                          required
                          value={profile.age}
                          onChange={handleChange}
                          placeholder="21"
                          className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Gender</span>
                        <select 
                          name="gender" 
                          value={profile.gender}
                          onChange={handleChange}
                          className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%238C8379%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat"
                        >
                          <option value="" disabled>Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Caste Category</span>
                        <select 
                          name="caste" 
                          value={profile.caste}
                          onChange={handleChange}
                          className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:10px_6px]"
                        >
                          <option value="" disabled>Select Caste</option>
                          {CASTES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">State</span>
                        <select name="state" value={profile.state} onChange={handleChange} className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:10px_6px]">
                          <option value="" disabled>Select State</option>
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Educational Qualification</span>
                      <select name="educationLevel" value={profile.educationLevel} onChange={handleChange} className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:10px_6px] focus:outline-none">
                        <option value="" disabled>Select Qualification</option>
                        {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Occupation</span>
                      <select name="occupation" value={profile.occupation} onChange={handleChange} className="w-full bg-white border border-natural-secondary rounded-xl px-4 py-3 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:10px_6px] focus:outline-none">
                        <option value="" disabled>Select Occupation</option>
                        {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1.5 leading-none">Annual Family Income Range</span>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted" />
                        <select name="familyIncome" value={profile.familyIncome} onChange={handleChange} className="w-full bg-white border border-natural-secondary rounded-xl pl-10 pr-4 py-3 focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:10px_6px]">
                          <option value="" disabled>Select Income Range</option>
                          {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </label>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-natural-secondary">
                        <span className="text-sm font-medium">Minority Status</span>
                        <select name="isMinority" value={profile.isMinority} onChange={handleChange} className="bg-transparent text-sm font-bold text-natural-primary focus:outline-none">
                          <option value="" disabled>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-natural-secondary">
                        <span className="text-sm font-medium">Disability (PwD)</span>
                        <select name="disabilityStatus" value={profile.disabilityStatus} onChange={handleChange} className="bg-transparent text-sm font-bold text-natural-primary focus:outline-none">
                          <option value="" disabled>Select</option>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-natural-secondary">
                        <span className="text-sm font-medium">Residency</span>
                        <select name="residency" value={profile.residency} onChange={handleChange} className="bg-transparent text-sm font-bold text-natural-primary focus:outline-none">
                          <option value="" disabled>Select</option>
                          <option>Urban</option>
                          <option>Rural</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      className="w-full bg-natural-primary text-white font-bold py-4 rounded-full shadow-lg hover:bg-natural-primary/90 transition-all flex items-center justify-center gap-2 group"
                    >
                      Continue to Purpose
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>
              </section>

              {/* Info Side */}
              <div className="hidden lg:flex flex-col justify-center gap-12 py-12 px-8">
                <div>
                  <h2 className="text-5xl font-serif font-medium text-natural-text leading-tight">
                    Universal access to <span className="text-natural-accent">equity</span> & welfare.
                  </h2>
                  <p className="text-natural-muted mt-6 text-lg max-w-md italic leading-relaxed">
                    By providing your demographic details, our secure analysis engine matches you against thousands of Central and State schemes.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/40 p-6 rounded-3xl border border-natural-secondary/50">
                    <h4 className="text-3xl font-bold text-natural-primary">1.4B</h4>
                    <p className="text-[10px] font-bold text-natural-muted uppercase mt-1">Beneficiaries Possible</p>
                  </div>
                  <div className="bg-white/40 p-6 rounded-3xl border border-natural-secondary/50">
                    <h4 className="text-3xl font-bold text-natural-primary">98%</h4>
                    <p className="text-[10px] font-bold text-natural-muted uppercase mt-1">Accuracy Goal</p>
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
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <span className="text-[10px] font-bold text-natural-accent uppercase tracking-widest bg-natural-accent/5 px-3 py-1 rounded-full border border-natural-accent/10">Step 2: Intent</span>
                <h2 className="text-4xl font-serif font-medium text-natural-text mt-4">What are you looking for?</h2>
                <p className="text-natural-muted mt-2">Select one or more categories to narrow down your results.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {PURPOSES.map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPurposes.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePurpose(p.id)}
                      className={cn(
                        "p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden group",
                        isSelected 
                          ? "border-natural-primary bg-natural-primary/5 shadow-xl shadow-natural-primary/5" 
                          : "border-natural-secondary bg-white hover:border-natural-primary/30"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", p.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{p.label}</h3>
                        <p className="text-xs text-natural-muted mt-1 font-medium italic opacity-80">
                          {isSelected ? 'Selected' : 'Find related benefits'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 animate-in zoom-in">
                          <CheckCircle2 className="w-6 h-6 text-natural-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center text-sm font-bold text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setStep('profile')}
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-natural-muted hover:text-natural-text transition-colors"
                >
                  Back to Profile
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="w-full sm:w-auto bg-natural-primary text-white font-bold px-12 py-4 rounded-full shadow-lg hover:bg-natural-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  Discover Eligible Schemes
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-end mb-8 border-b border-natural-secondary pb-8">
                <div className="flex-1">
                  <h1 className="text-4xl font-serif font-medium text-natural-text">For you, {profile.name.split(' ')[0]}</h1>
                  <p className="text-sm text-natural-muted mt-2 italic">Analyzed thousands of Central and State schemes against your {selectedPurposes.length} primary interests.</p>
                </div>
                <button 
                  onClick={() => { setStep('profile'); setSelectedPurposes([]); setRecommendations([]); }}
                  className="text-xs font-bold text-natural-primary hover:underline underline-offset-4"
                >
                  START OVER
                </button>
              </div>

              {loading && (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-natural-white rounded-[2rem] p-10 border border-natural-secondary animate-pulse">
                      <div className="h-4 bg-natural-base rounded w-1/4 mb-4"></div>
                      <div className="h-10 bg-natural-base rounded w-3/4 mb-8"></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="h-24 bg-natural-base rounded"></div>
                        <div className="h-24 bg-natural-base rounded"></div>
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
                      className="group bg-natural-white rounded-[3rem] p-12 shadow-sm border border-natural-secondary hover:border-natural-primary transition-all hover:shadow-2xl hover:shadow-natural-primary/5 relative overflow-hidden"
                    >
                      {/* Badge */}
                      <div className="flex items-center gap-2 mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-natural-accent bg-natural-accent/5 px-3 py-1.5 rounded-full border border-natural-accent/10">
                           {scheme.category}
                        </span>
                        <div className="px-4 py-1.5 bg-natural-primary text-white text-[10px] font-bold rounded-full ml-auto uppercase tracking-widest shadow-sm">
                          {scheme.eligibility_match_score}% Confidence
                        </div>
                      </div>

                      <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-[0.2em] mb-2">{scheme.ministry}</h4>
                      <h3 className="text-3xl font-bold tracking-tight mb-4 group-hover:text-natural-primary transition-colors pr-20">
                        {scheme.scheme_name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-4 mb-8">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-natural-muted uppercase bg-natural-base/50 px-3 py-1.5 rounded-lg border border-natural-secondary/50">
                          <MapPin className="w-3 h-3" /> {scheme.state}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-natural-muted uppercase bg-natural-base/50 px-3 py-1.5 rounded-lg border border-natural-secondary/50">
                          <Info className="w-3 h-3" /> {scheme.deadline !== "All" ? scheme.deadline : 'Open Year-Round'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-natural-muted uppercase bg-natural-base/50 px-3 py-1.5 rounded-lg border border-natural-secondary/50">
                          <IndianRupee className="w-3 h-3" /> {scheme.income_limit}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-10 mb-10 border-y border-natural-secondary/50 py-12">
                        <div>
                          <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                             Core Provisions & Benefits
                          </h4>
                          <ul className="space-y-4">
                            {scheme.benefits.map((item, i) => (
                              <li key={i} className="text-sm font-semibold flex items-start gap-3 text-natural-text/90 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-natural-accent mt-2 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                             Required Documents
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {scheme.documents_required.map((doc, i) => (
                              <span key={i} className="text-[10px] font-bold bg-white border border-natural-secondary px-3 py-1.5 rounded-lg text-natural-text/70 uppercase tracking-tight">
                                {doc}
                              </span>
                            ))}
                          </div>
                          
                          <div className="mt-8 pt-8 border-t border-natural-secondary/30">
                            <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-2">Education Requirement</h4>
                            <p className="text-sm font-bold text-natural-primary">{scheme.education_requirement}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-natural-base/30 rounded-[2rem] p-10 mb-10 border border-natural-secondary/30 grid md:grid-cols-2 gap-10">
                        <div>
                          <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-natural-primary" /> Why Am I Eligible?
                          </h4>
                          <ul className="space-y-3">
                            {scheme.eligibility_bullets.map((bullet, i) => (
                              <li key={i} className="text-xs font-bold text-natural-text/80 flex items-start gap-2 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-natural-primary mt-1.5 flex-shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Intelligence Report
                          </h4>
                          <p className="text-sm text-natural-text/70 leading-relaxed font-medium italic">
                            {scheme.why_this_matches}
                          </p>
                          {scheme.missing_eligibility_factors.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-natural-secondary/30">
                              <h5 className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none">
                                <AlertCircle className="w-3 h-3" /> Potential Eligibility Gaps
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {scheme.missing_eligibility_factors.map((factor, i) => (
                                  <span key={i} className="text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-md uppercase">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6">
                        <a 
                          href={scheme.official_source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-[1.5] bg-natural-primary text-white text-center py-5 rounded-full font-bold hover:bg-natural-primary/95 transition-all shadow-xl shadow-natural-primary/20"
                        >
                          Access Official Portal
                        </a>
                        <div className="flex-1 bg-white border border-natural-secondary text-natural-text p-1 rounded-full flex">
                          <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-natural-muted uppercase pl-4">
                            Source: {new URL(scheme.official_source).hostname.replace('www.', '')}
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
