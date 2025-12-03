import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Clock, User, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  emoji: string | null;
  image_url: string | null;
  author: string | null;
  estimated_time: number | null;
  published_date: string | null;
  featured: boolean | null;
}

const TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  webinar: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  guide: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  video: "bg-red-500/20 text-red-700 dark:text-red-300",
  podcast: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
};

const TYPE_GRADIENTS: Record<string, string> = {
  article: "from-blue-600/90 via-blue-700/80 to-blue-900/90",
  webinar: "from-purple-600/90 via-purple-700/80 to-purple-900/90",
  guide: "from-emerald-600/90 via-emerald-700/80 to-emerald-900/90",
  video: "from-red-600/90 via-red-700/80 to-red-900/90",
  podcast: "from-orange-600/90 via-orange-700/80 to-orange-900/90",
};

export default function InsightsHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("published_date", { ascending: false });

      if (!error && data) {
        setResources(data);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const featuredResources = resources.filter((r) => r.featured);
  const filteredResources = selectedType
    ? resources.filter((r) => r.type === selectedType)
    : resources;

  const types = ["article", "webinar", "guide", "video", "podcast"];

  return (
    <AppLayout>
      <HeroBanner
        emoji="💡"
        title="Insights Hub"
        description="Curated knowledge to fuel your law firm's growth journey"
      />

      <div className="p-6 md:p-8 space-y-8">
        {/* Featured Carousel */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[320px] w-full rounded-2xl" />
          </div>
        ) : featuredResources.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Featured Insights</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => emblaApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => emblaApi?.scrollNext()}
                  disabled={!canScrollNext}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {featuredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-11px)]"
                  >
                    <a
                      href={resource.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div
                        className={`relative h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br ${
                          TYPE_GRADIENTS[resource.type] || TYPE_GRADIENTS.article
                        }`}
                        style={
                          resource.image_url
                            ? {
                                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${resource.image_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      >
                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <Badge className={TYPE_COLORS[resource.type] || TYPE_COLORS.article}>
                              {resource.emoji} {resource.type}
                            </Badge>
                            <ExternalLink className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:underline">
                              {resource.title}
                            </h3>
                            {resource.description && (
                              <p className="text-white/80 text-sm line-clamp-2">
                                {resource.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-white/70 text-sm">
                              {resource.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {resource.author}
                                </span>
                              )}
                              {resource.estimated_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {resource.estimated_time} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Filter Pills */}
        <section>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="rounded-full"
            >
              All
            </Button>
            {types.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="rounded-full capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </section>

        {/* All Insights Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}s` : "All Insights"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 overflow-hidden">
                    {resource.image_url && (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${resource.image_url})` }}
                      />
                    )}
                    <CardContent className={resource.image_url ? "p-4" : "p-5"}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={`${TYPE_COLORS[resource.type] || ""} text-xs capitalize`}
                        >
                          {resource.emoji} {resource.type}
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>

                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>

                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {resource.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {resource.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {resource.author}
                          </span>
                        )}
                        {resource.estimated_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {resource.estimated_time} min
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No insights found.</p>
            </Card>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
