"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Globe, ExternalLink, ShieldCheck, Layers, Users, ArrowRight, ArrowUpRight } from "lucide-react"; 

interface AlternateSource {
  platform: string;
  url: string;
}

interface Props {
  _id: string;
  title: string;
  description: string;
  organizer: string;
  source_platform: string;
  source_url: string;
  alternate_sources: AlternateSource[];
  category: string;
  tags: string[];
  deadline: string | Date | null;
  start_date: string | Date | null;
  location: string | null;
  is_remote: boolean;
  image_url: string | null;
}

const getPlatformColor = (platform: string) => {
  switch(platform?.toLowerCase()) {
    case 'mlh': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'hackerearth': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'unstop': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'devfolio': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-primary/20 text-primary border-primary/30';
  }
};

const getTechFallbackImage = (category?: string, tags?: string[], id?: string): string => {
  const allTerms = [category, ...(tags || [])].map(t => t?.toLowerCase()).filter(Boolean);

  const techKeywords: Record<string, string> = {
    hackathon: "hackathon,coding",
    "machine learning": "artificial+intelligence,machine+learning",
    ai: "artificial+intelligence,neural+network",
    web: "web+development,programming",
    mobile: "mobile+app,smartphone+development",
    blockchain: "blockchain,cryptocurrency+tech",
    cybersecurity: "cybersecurity,hacking",
    cloud: "cloud+computing,servers",
    devops: "devops,kubernetes",
    data: "data+science,analytics",
    "open source": "open+source,github",
    competitive: "competitive+programming,coding+contest",
    gaming: "game+development,esports+tech",
    design: "ui+design,ux+design",
    robotics: "robotics,arduino",
    iot: "internet+of+things,smart+devices",
  };

  for (const term of allTerms) {
    for (const [keyword, query] of Object.entries(techKeywords)) {
      if (term?.includes(keyword)) {
        return `https://source.unsplash.com/600x400/?${query}&sig=${id}`;
      }
    }
  }

  // Generic tech fallback (never nature/mountains)
  const techFallbacks = [
    "programming,code",
    "technology,computer",
    "developer,software",
    "tech+conference,coding",
    "open+source,keyboard",
  ];
  const index = id ? id.charCodeAt(id.length - 1) % techFallbacks.length : 0;
  return `https://source.unsplash.com/600x400/?${techFallbacks[index]}&sig=${id}`;
};

const OpportunityCard = ({ 
  _id, title, description, organizer, source_platform, 
  alternate_sources = [], category, tags = [], location, 
  is_remote, image_url 
}: Props) => {

  const shortDescription = description 
    ? description.substring(0, 100) + (description.length > 100 ? "..." : "")
    : "View event details to learn more.";

  const totalSources = 1 + (alternate_sources?.length || 0);

  return (
    <Link href={`/opportunities/${_id}`} className="block group perspective-1000 h-[400px] w-full relative z-10 cursor-pointer">
      
      <div className="relative h-full w-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 rounded-2xl shadow-xl">
        
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 h-full w-full backface-hidden rounded-2xl overflow-hidden bg-dark-200 border border-white/10 flex flex-col">
          
          {/* Top Badges overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 backdrop-blur-md ${getPlatformColor(source_platform)}`}>
                <ShieldCheck size={14} />
                {source_platform?.toUpperCase()}
              </span>
              {totalSources > 1 && (
                <span className="bg-dark-200/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Layers size={12} className="text-primary"/> +{totalSources - 1}
                </span>
              )}
            </div>
            
            {category && (
              <span className="bg-black/60 backdrop-blur-md border border-white/10 text-light-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {category}
              </span>
            )}
          </div>

          {/* Image Section */}
          <div className="relative h-[60%] w-full overflow-hidden bg-dark-300">
             <Image 
                src={image_url || getTechFallbackImage(category, tags, _id)} 
                alt={title} 
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 400px"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-transparent to-transparent"/>
             
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5">
                 <ShieldCheck size={12} className="text-primary" /> Verified
             </div>
          </div>

          {/* Content Section */}
          <div className="p-5 flex flex-col justify-between h-[40%] relative">
            
            <div className="flex items-center gap-2 mb-1 text-primary text-xs font-bold uppercase tracking-wider truncate">
               <span className="truncate">{organizer}</span>
            </div>

            <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 transition-colors pr-8">
                {title}
            </h3>
            
            <div className="flex flex-col gap-2.5 mt-2">
               <div className="flex justify-between items-center w-full">
                   <div className="flex items-center gap-1.5 text-sm text-light-200 truncate max-w-[70%]">
                      {is_remote ? (
                        <Globe size={14} className="text-primary shrink-0" />
                      ) : (
                        <MapPin size={14} className="text-primary shrink-0" />
                      )}
                      <span className="truncate">{is_remote ? "Online / Remote" : location || "TBD"}</span>
                   </div>

                   <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                       View <ArrowUpRight size={14} />
                   </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className="absolute inset-0 h-full w-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden bg-dark-200 p-6 border-2 border-primary/20 flex flex-col justify-between">
            
            <div>
                <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
                    Quick Look
                </h4>
                
                <p className="text-white text-sm leading-relaxed opacity-90 font-medium line-clamp-4">
                    {shortDescription}
                </p>

                <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tags?.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {tags?.length > 4 && (
                        <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                </div>
            </div>

            {/* ACTION ROW */}
            <div className="flex gap-3 items-center pt-4 border-t border-white/10 mt-auto">
                <div className={`flex-1 py-2.5 rounded-lg text-center font-bold text-sm transition-colors flex items-center justify-center gap-2 bg-primary text-black hover:bg-white`}>
                    View Details <ArrowRight size={16} />
                </div>
            </div>
        </div>

      </div>
    </Link>
  )
}

export default OpportunityCard;
