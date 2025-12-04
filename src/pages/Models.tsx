import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Clock, Users, ArrowRight, Play, Search, CheckCircle } from "lucide-react";
import { useReactions } from "@/hooks/use-reactions";
import { AccessBadge } from "@/components/AccessBadge";

interface Topic {
  id: string;
  name: string;
}

interface TopicCategory {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  short_description: string | null;
  emoji: string | null;
  audience: string[] | null;
  time_estimate: string | null;
  tags: string[] | null;
  likes_count: number | null;
  unlock_level: string | null;
  topics?: Topic[];
  topicCategoryIds?: string[];
}

type FilterType = "all" | "activated" | "not-activated";

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>([]);
  const [activatedModelIds, setActivatedModelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>("all");

  const { isLiked, isLoading, toggleReaction } = useReactions({
    targetType: "model",
    targetIds: models.map(m => m.id),
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch models and topic categories in parallel
      const [modelsRes, topicCatsRes] = await Promise.all([
        supabase.from("models").select("*").order("created_at", { ascending: true }),
        supabase.from("topic_categories").select("id, name").order("order_index"),
      ]);

      if (topicCatsRes.data) {
        setTopicCategories(topicCatsRes.data);
      }

      if (!modelsRes.error && modelsRes.data) {
        // Fetch topic links and topic category links for all models
        const [topicLinksRes, topicCatLinksRes] = await Promise.all([
          supabase.from("topic_models").select("model_id, topic_id, topics(id, name)").in("model_id", modelsRes.data.map(m => m.id)),
          supabase.from("model_topic_categories").select("model_id, topic_category_id").in("model_id", modelsRes.data.map(m => m.id)),
        ]);

        // Map topics and topic categories to models
        const modelsWithTopics = modelsRes.data.map(model => ({
          ...model,
          topics: (topicLinksRes.data || [])
            .filter(link => link.model_id === model.id)
            .map(link => link.topics as unknown as Topic)
            .filter(Boolean),
          topicCategoryIds: (topicCatLinksRes.data || [])
            .filter(link => link.model_id === model.id)
            .map(link => link.topic_category_id),
        }));

        setModels(modelsWithTopics);
      }

      // Fetch activated models for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: activatedData } = await supabase
          .from("activated_models")
          .select("model_id")
          .eq("user_id", user.id);

        if (activatedData) {
          setActivatedModelIds(new Set(activatedData.map(a => a.model_id)));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLike = async (e: React.MouseEvent, modelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasLiked = isLiked(modelId);
    
    // Optimistically update the UI
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, likes_count: (model.likes_count || 0) + (wasLiked ? -1 : 1) }
        : model
    ));
    
    await toggleReaction(modelId);
  };

  const isActivated = (modelId: string) => activatedModelIds.has(modelId);

  // Filter and search models
  const filteredModels = models.filter(model => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Activation filter
    const matchesFilter = 
      filter === "all" ||
      (filter === "activated" && isActivated(model.id)) ||
      (filter === "not-activated" && !isActivated(model.id));

    // Topic category filter
    const matchesTopicCategory = 
      topicCategoryFilter === "all" ||
      model.topicCategoryIds?.includes(topicCategoryFilter);

    return matchesSearch && matchesFilter && matchesTopicCategory;
  });

  return (
    <AppLayout>
      <HeroBanner
        emoji="📚"
        title="Models"
        description="Interactive strategic frameworks to help you plan, position, and grow your practice."
      />

      <div className="p-6 md:p-8">
        {/* Search and Filter */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={topicCategoryFilter} onValueChange={setTopicCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Topic Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {topicCategories.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "activated" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("activated")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Active
            </Button>
            <Button
              variant={filter === "not-activated" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("not-activated")}
            >
              Not Started
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredModels.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">
              {models.length === 0 ? "No models yet" : "No models found"}
            </h3>
            <p className="text-muted-foreground">
              {models.length === 0 
                ? "Models are being prepared. Check back soon!"
                : "Try adjusting your search or filter."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => {
              const activated = isActivated(model.id);
              return (
                <Card
                  key={model.id}
                  className={`group hover:shadow-elevated transition-all duration-300 flex flex-col ${
                    activated ? "border-green-500/40 bg-green-50 dark:bg-green-950/20" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-4xl">{model.emoji || "📚"}</span>
                        {activated && (
                          <Badge className="text-xs bg-green-500 hover:bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        <AccessBadge accessLevel={model.unlock_level} size="sm" />
                      </div>
                      <button
                        onClick={(e) => handleLike(e, model.id)}
                        disabled={isLoading(model.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          isLiked(model.id)
                            ? "bg-red-500/10 text-red-500"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked(model.id) ? "fill-current" : ""}`} />
                        <span className="text-sm">{model.likes_count || 0}</span>
                      </button>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {model.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {model.short_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {model.topics?.slice(0, 3).map((topic) => (
                        <Badge key={topic.id} variant="secondary" className="text-xs">
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {model.time_estimate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {model.time_estimate}
                        </span>
                      )}
                      {model.audience && model.audience.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {model.audience.join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto">
                      <Button 
                        asChild 
                        variant="outline"
                        className={`w-full ${activated ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" : ""}`}
                      >
                        <Link to={`/models/${model.id}`}>
                          {activated ? (
                            <>
                              View Model
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          ) : (
                            <>
                              Activate Model
                              <Play className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
