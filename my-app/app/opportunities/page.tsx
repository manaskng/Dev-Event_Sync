import { getOpportunities } from "@/lib/actions/opportunity.actions";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import FilterPanel from "@/components/opportunities/FilterPanel";
import NewBadge from "@/components/opportunities/NewBadge";
import { auth } from "@/auth";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function OpportunitiesFeed(
  props: { searchParams: Promise<{ [key: string]: string | undefined }> }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  
  const query = searchParams?.query || "";
  const category = searchParams?.category || "";
  const tags = searchParams?.tags ? searchParams.tags.split(",") : [];
  const page = searchParams?.page ? Number(searchParams.page) : 1;

  const result = await getOpportunities({
    query,
    category,
    tags,
    page,
    limit: 40,
  });

  const opportunities = result?.opportunities || [];
  const totalOpportunities = result?.totalOpportunities || 0;
  const isNext = result?.isNext || false;
  const totalPages = Math.ceil(totalOpportunities / 40);

  // Build query string for pagination links
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category) params.set("category", category);
    if (tags.length > 0) params.set("tags", tags.join(","));
    params.set("page", String(p));
    return `/opportunities?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-dark-100 pb-20">
      {/* Hero Section */}
      <section className="relative w-full bg-dark-200 border-b border-white/10 pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pattern-grid-lg opacity-5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Global <span className="text-primary">Opportunities</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mb-8">
                The ultimate aggregator for hackathons, coding contests, and hiring challenges across Unstop, Devfolio, MLH, HackerEarth, and more.
              </p>

              {/* Stats Banner */}
              <div className="flex flex-wrap gap-4">
                 <div className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <span className="text-primary font-bold">100+</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Tracked</p>
                      <p className="text-white font-bold">{totalOpportunities} Opportunities</p>
                    </div>
                 </div>

                 <div className="bg-dark-100/50 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <span className="text-purple-400 font-bold">5</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Platforms</p>
                      <p className="text-white font-bold">Unstop, Devfolio...</p>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="mb-2">
              <NewBadge email={session?.user?.email} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-1/4">
            <FilterPanel />
          </div>

          {/* Right Content - Feed */}
          <div className="w-full lg:w-3/4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">
                {query || category || tags.length > 0 ? 'Search Results' : 'Latest Opportunities'}
                <span className="ml-3 text-sm font-medium px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400">
                  {totalOpportunities} found
                </span>
              </h2>
              {totalPages > 1 && (
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              )}
            </div>

            {opportunities.length === 0 ? (
              <div className="w-full h-64 bg-dark-200 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-xl font-bold text-white mb-2">No opportunities found</h3>
                <p className="text-gray-400">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {opportunities.map((opp: any) => (
                  <OpportunityCard
                    key={opp._id}
                    _id={opp._id}
                    title={opp.title}
                    description={opp.description}
                    organizer={opp.organizer}
                    source_platform={opp.source_platform}
                    source_url={opp.source_url}
                    alternate_sources={opp.alternate_sources}
                    category={opp.category}
                    tags={opp.tags}
                    deadline={opp.deadline}
                    start_date={opp.start_date}
                    location={opp.location}
                    is_remote={opp.is_remote}
                    image_url={opp.image_url}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                {page > 1 ? (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-dark-200 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 hover:border-primary/50 transition-all"
                  >
                    <ChevronLeft size={18} /> Previous
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-6 py-3 bg-dark-200/50 border border-white/5 rounded-xl text-gray-600 font-bold cursor-not-allowed">
                    <ChevronLeft size={18} /> Previous
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <Link
                        key={pageNum}
                        href={buildPageUrl(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                          pageNum === page
                            ? 'bg-primary text-black'
                            : 'bg-dark-200 border border-white/10 text-gray-400 hover:text-white hover:border-primary/50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {isNext ? (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-dark-200 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 hover:border-primary/50 transition-all"
                  >
                    Next <ChevronRight size={18} />
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-6 py-3 bg-dark-200/50 border border-white/5 rounded-xl text-gray-600 font-bold cursor-not-allowed">
                    Next <ChevronRight size={18} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
