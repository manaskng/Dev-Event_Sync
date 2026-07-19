import { getOpportunityById } from "@/lib/actions/opportunity.actions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Globe, ExternalLink, ShieldCheck, Tag, Trophy, UserCircle, Clock, ChevronLeft } from "lucide-react";

const getCategoryGradient = (category?: string, tags?: string[]): string => {
  const allTerms = [category, ...(tags || [])].map(t => t?.toLowerCase()).filter(Boolean);
  const gradients: Record<string, string> = {
    hackathon: 'from-indigo-600 to-purple-700', ai: 'from-cyan-600 to-blue-700',
    'machine learning': 'from-cyan-600 to-blue-700', web: 'from-amber-500 to-orange-600',
    mobile: 'from-pink-500 to-rose-600', blockchain: 'from-yellow-500 to-amber-600',
    cybersecurity: 'from-emerald-600 to-green-700', cloud: 'from-sky-500 to-blue-600',
    data: 'from-violet-500 to-purple-600', competitive: 'from-red-500 to-rose-600',
    competition: 'from-red-500 to-orange-600', gaming: 'from-fuchsia-500 to-pink-600',
    design: 'from-orange-400 to-pink-500',
  };
  for (const term of allTerms) {
    for (const [keyword, gradient] of Object.entries(gradients)) {
      if (term?.includes(keyword)) return gradient;
    }
  }
  return 'from-slate-700 to-zinc-800';
};

const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    hackathon: '⚡', ai: '🤖', 'machine learning': '🧠', web: '🌐',
    mobile: '📱', blockchain: '⛓️', cybersecurity: '🔒', cloud: '☁️',
    data: '📊', competitive: '🏆', competition: '🏆', gaming: '🎮',
    design: '🎨',
  };
  return icons[category?.toLowerCase() || ''] || '💻';
};

export default async function OpportunityDetails({ params }: { params: Promise<{ id: string }> }) {
  // Await the params object in Next.js 15
  const resolvedParams = await params;
  const { id } = resolvedParams;

  let opportunity;
  try {
    opportunity = await getOpportunityById(id);
  } catch (error) {
    return notFound();
  }

  if (!opportunity) {
    return notFound();
  }

  const {
    title,
    description,
    organizer,
    source_platform,
    source_url,
    category,
    tags,
    deadline,
    start_date,
    end_date,
    location,
    is_remote,
    prize_info,
    eligibility,
    image_url,
    viewCount,
    scraped_at,
    alternate_sources
  } = opportunity;

  const totalSources = 1 + (alternate_sources?.length || 0);

  return (
    <div className="min-h-screen bg-dark-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        
        <Link href="/opportunities" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8">
          <ChevronLeft size={20} />
          Back to Opportunities
        </Link>

        {/* Header Section */}
        <div className="bg-dark-200 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8">
          
          <div className={`relative h-64 md:h-80 w-full bg-gradient-to-br ${getCategoryGradient(category, tags)}`}>
             {image_url ? (
               <Image 
                  src={image_url} 
                  alt={title} 
                  fill
                  className="object-cover opacity-60"
                  priority
               />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                   <div className="text-8xl opacity-20 drop-shadow-lg">{getCategoryIcon(category)}</div>
                   <p className="text-white/20 text-sm font-bold uppercase tracking-[0.3em] mt-3">{category || 'Opportunity'}</p>
                 </div>
               </div>
             )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/60 to-transparent"/>
            
            {/* Badges */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-bold px-3 py-1.5 rounded-md border flex items-center gap-2 backdrop-blur-md bg-primary/20 text-primary border-primary/30 uppercase tracking-wider">
                  <ShieldCheck size={16} />
                  {source_platform}
                </span>
                {totalSources > 1 && (
                  <span className="bg-dark-200/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    +{totalSources - 1} Alternate Sources
                  </span>
                )}
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-black/50 border border-white/10 text-xs font-bold uppercase tracking-wider text-light-200 backdrop-blur-md">
                {category}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-2">
                {title}
              </h1>
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <UserCircle size={20} />
                {organizer}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 md:px-10 py-6 border-t border-white/5 bg-dark-200/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Globe size={18} className={is_remote ? "text-primary" : ""} />
                {is_remote ? "Online / Remote" : location || "TBD"}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                {viewCount} Views
              </div>
            </div>
            
            <a 
              href={source_url} 
              target="_blank" 
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-dark-100 font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/50 flex items-center justify-center gap-2"
            >
              Apply Now <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Details) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-dark-200 border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 bg-dark-300 border-b border-white/5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                   <Globe size={16} className="text-primary shrink-0"/>
                   <span className="text-sm font-bold text-gray-300 truncate max-w-[200px] sm:max-w-xs">{source_url}</span>
                </div>
                <a href={source_url} target="_blank" rel="noreferrer" className="text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors shrink-0 font-bold">
                  Open in New Tab <ExternalLink size={12}/>
                </a>
              </div>
              <div className="relative w-full h-[600px] md:h-[800px] bg-dark-100">
                 {/* Fallback underneath */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-0">
                    <Globe size={48} className="text-gray-600 mb-4 opacity-50"/>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Connecting to {source_platform}...</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                      If the website refuses to connect and displays an error, it means the platform has disabled external embedding.
                    </p>
                    <a href={source_url} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all">
                      View Original Page Instead
                    </a>
                 </div>
                 
                 <iframe 
                    src={source_url} 
                    className="absolute inset-0 w-full h-full border-none z-10 bg-white"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                 />
              </div>
            </div>

            {eligibility && (
              <div className="bg-dark-200 border border-white/5 rounded-3xl p-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-4">Eligibility</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{eligibility}</p>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            
            {/* Quick Info */}
            <div className="bg-dark-200 border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
              
              {start_date && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-dark-300 rounded-xl text-primary border border-white/5">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Starts</p>
                    <p className="text-sm text-gray-200 font-medium">{new Date(start_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}

              {deadline && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-red-400/80 uppercase font-bold mb-1">Deadline</p>
                    <p className="text-sm text-white font-medium">{new Date(deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}

              {prize_info && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-400/80 uppercase font-bold mb-1">Prizes</p>
                    <p className="text-sm text-white font-medium">{prize_info}</p>
                  </div>
                </div>
              )}
              
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="bg-dark-200 border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm text-gray-400 uppercase font-bold mb-4 flex items-center gap-2">
                  <Tag size={16} /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1.5 bg-dark-300 border border-white/5 text-gray-300 text-xs rounded-lg hover:text-primary hover:border-primary/30 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Scraped Info */}
            <div className="text-center text-xs text-gray-600 mt-8">
              Data automatically curated by DevEventSync AI on {new Date(scraped_at).toLocaleDateString()}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
