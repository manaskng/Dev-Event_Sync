import { auth } from "@/auth"; 
import { getUserOnboarding } from "@/lib/actions/user.actions"; 
import EventCard from "@/components/EventCard";
import SearchForm from "@/components/SearchForm";
import TrendingCarousel from "@/components/TrendingCarousel"; 
import { getAllEvents, getUpcomingEvents, getMLRecommendedEvents } from "@/lib/actions/event.actions";
import Link from "next/link";
import { Sparkles, Clock, Settings, Flame, SearchX, Brain, Zap } from "lucide-react"; 

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const { query } = await searchParams;
    const session = await auth();

    //  SMART RECOMMENDATION LOGIC ---
    let userInterestsLabel = "Tech"; 
    let hasInterests = false;
    let user: any = null;

    if (session) {
        user = await getUserOnboarding();
        if (user?.interests && user.interests.length > 0) {
            userInterestsLabel = user.interests.slice(0, 3).join(", "); 
            hasInterests = true;
        }
    }

    // DATA FETCHING ---
    // Using Promise.all to fetch everything concurrently instead of sequential waterfall
    
    const [
      allEvents, 
      upcomingEvents, 
      mlRecommendations, 
    ] = await Promise.all([
      getAllEvents({ query: query || '', limit: 12 }),
      !query ? getUpcomingEvents(8) : Promise.resolve([]),
      (!query && session?.user?.email) ? getMLRecommendedEvents(session.user.email, 6) : Promise.resolve({ events: [], isMLPowered: false }),
    ]);

    // 1. Latest Events
    const latestEvents = allEvents || [];
    
    // 2. Upcoming (Trending Carousel)
    const upcomingCarouselItems: React.ReactNode[] = [];
    upcomingEvents.forEach(e => upcomingCarouselItems.push(<EventCard key={`evt-${e._id}`} {...e} />));
    
    // 3. Recommended Events
    const recommendedEvents = mlRecommendations?.events || [];
    const isMLPowered = mlRecommendations?.isMLPowered || false;
    
    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

    return (
        <section className="pb-20 relative px-4 overflow-hidden">
            
            {/* HERO HEADER (Always Visible) */}
            <div className="relative z-10 text-center pt-16 pb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6 animate-fade-in backdrop-blur-sm">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                   </span>
                   {greeting}, {session?.user?.name || "Builder"}.
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 mb-6 tracking-tight">
                    Don't just code. <br /> <span className="text-primary">Connect.</span>
                </h1>
                <SearchForm />
            </div>

            {/* --- LOGIC BRANCHING --- */}
            
            {query ? (
                // 🔍 VIEW A: SEARCH RESULTS
                <div className="max-w-7xl mx-auto mt-8">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                        Results for <span className="text-primary">"{query}"</span>
                    </h2>

                    {latestEvents.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {latestEvents.map((item, idx) => (
                                <div key={idx}>
                                    <EventCard {...item} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <SearchX size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-white">No matches found</h3>
                            <p className="text-gray-400 mt-2">Try searching for "React", "AI", or "London".</p>
                            <Link href="/" className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition-all">
                                Clear Search
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                // 🏠 VIEW B: SMART DASHBOARD (Default)
                <>
                    {/* Trending Section */}
                    {upcomingCarouselItems.length > 0 && (
                        <div className="mb-24 w-full animate-fade-in-up">
                            <div className="flex justify-between items-end mb-8 px-4 max-w-7xl mx-auto">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Clock className="text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold font-schibsted-grotesk text-white">Happening Soon</h2>
                                        <p className="text-sm text-gray-400">Urgent events closing soon</p>
                                    </div>
                                </div>
                            </div>
                            <TrendingCarousel items={upcomingCarouselItems} />
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
                        
                        {/* Main Feed */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Sparkles className="text-purple-400" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold font-schibsted-grotesk text-white">Latest Community Events</h3>
                            </div>
                            
                            {latestEvents.length > 0 ? (
                                <ul className="grid sm:grid-cols-2 gap-6">
                                    {latestEvents.map((item, idx) => (
                                        <li key={idx} className="list-none">
                                            <EventCard {...item} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl bg-dark-200">
                                    <p className="text-gray-400 mb-4">No community events available yet.</p>
                                    <Link href="/events/create" className="px-6 py-2 bg-primary text-black font-bold rounded-full">
                                        Host an Event
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* RELEVANCE SIDEBAR — ML Powered */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="sticky top-24">
                                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Flame className="text-orange-500" size={20} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-white">For You</h3>
                                                {isMLPowered && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                                                        <Brain size={10} />
                                                        ML
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {hasInterests ? `Based on "${userInterestsLabel}"` : "Popular picks"}
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/profile/edit" title="Edit Interests" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <Settings size={16} className="text-gray-400" />
                                    </Link>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {recommendedEvents.length > 0 ? recommendedEvents.map((rec, idx) => (
                                        <div key={idx} className="scale-95 origin-left relative">
                                            {/* Recommendation Reason Badge */}
                                            {rec.reason && (
                                                <div className="mb-2 flex items-center gap-2 flex-wrap">
                                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300">
                                                        <Zap size={10} className="text-yellow-400" />
                                                        {rec.reason}
                                                    </div>
                                                    {rec.score > 0 && (
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            {Math.round(rec.score * 100)}% match
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <EventCard {...rec.event} />
                                        </div>
                                    )) : (
                                        <div className="p-6 text-center border border-dashed border-white/10 rounded-xl">
                                            <p className="text-gray-500 text-sm">
                                                No recommendations available right now.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}