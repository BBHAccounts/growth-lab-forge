import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  seniority: string | null;
  role_title: string | null;
  firm_size: string | null;
  firm_type: string | null;
  interest_areas: string[];
  international_scope: boolean;
  growth_maturity_level: number;
  data_maturity_level: number;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
  recommended_seniority: string[];
  recommended_roles: string[];
  recommended_firm_sizes: string[];
  recommended_firm_types: string[];
  interest_area_keywords: string[];
  national_or_international: string[];
  min_growth_maturity: number;
  max_growth_maturity: number;
  min_data_maturity: number;
  max_data_maturity: number;
  category_key: string | null;
}

interface ScoredTopic extends Topic {
  score: number;
}

export interface RecommendedModel {
  id: string;
  name: string;
  emoji: string | null;
  short_description: string | null;
  slug: string | null;
}

export interface RecommendedVendorCategory {
  id: string;
  name: string;
}

export interface RecommendedResource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  emoji: string | null;
  author: string | null;
  estimated_time: number | null;
}

export interface Recommendations {
  topics: ScoredTopic[];
  models: RecommendedModel[];
  martechCategories: RecommendedVendorCategory[];
  resources: RecommendedResource[];
  loading: boolean;
}

function scoreTopicForUser(topic: Topic, profile: UserProfile): number {
  let score = 0;

  // +4 for overlap between user interest_areas and interest_area_keywords
  const userInterests = profile.interest_areas || [];
  const topicKeywords = topic.interest_area_keywords || [];
  for (const interest of userInterests) {
    if (topicKeywords.some((k) => k.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(k.toLowerCase()))) {
      score += 4;
    }
  }

  // +3 if user.role in recommended_roles
  if (profile.role_title && topic.recommended_roles.includes(profile.role_title)) {
    score += 3;
  }

  // +2 if user.seniority in recommended_seniority
  if (profile.seniority && topic.recommended_seniority.includes(profile.seniority)) {
    score += 2;
  }

  // +2 if user.firm_size in recommended_firm_sizes
  if (profile.firm_size && topic.recommended_firm_sizes.includes(profile.firm_size)) {
    score += 2;
  }

  // +2 if user.firm_type in recommended_firm_types
  if (profile.firm_type && topic.recommended_firm_types.includes(profile.firm_type)) {
    score += 2;
  }

  // +1 if user.international_scope in national_or_international
  const userScope = profile.international_scope ? 'international' : 'national';
  if (topic.national_or_international.includes(userScope)) {
    score += 1;
  }

  // +2 if user.growth_maturity_level is inside the Topic's maturity range
  const growthLevel = profile.growth_maturity_level || 1;
  if (growthLevel >= topic.min_growth_maturity && growthLevel <= topic.max_growth_maturity) {
    score += 2;
  }

  // +1 if user.data_maturity_level is inside the Topic's data maturity range
  const dataLevel = profile.data_maturity_level || 1;
  if (dataLevel >= topic.min_data_maturity && dataLevel <= topic.max_data_maturity) {
    score += 1;
  }

  return score;
}

export function useRecommendations(maxTopics: number = 5) {
  const [recommendations, setRecommendations] = useState<Recommendations>({
    topics: [],
    models: [],
    martechCategories: [],
    resources: [],
    loading: true,
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRecommendations((prev) => ({ ...prev, loading: false }));
          return;
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('seniority, role_title, firm_size, firm_type, interest_areas, international_scope, growth_maturity_level, data_maturity_level')
          .eq('user_id', user.id)
          .single();

        const profile: UserProfile = {
          seniority: profileData?.seniority || null,
          role_title: profileData?.role_title || null,
          firm_size: profileData?.firm_size || null,
          firm_type: profileData?.firm_type || null,
          interest_areas: profileData?.interest_areas || [],
          international_scope: profileData?.international_scope || false,
          growth_maturity_level: profileData?.growth_maturity_level || 1,
          data_maturity_level: profileData?.data_maturity_level || 1,
        };

        // Fetch active topics
        const { data: topicsData } = await supabase
          .from('topics')
          .select('*')
          .eq('active', true);

        const topics = (topicsData || []) as Topic[];

        // Score and sort topics
        const scoredTopics: ScoredTopic[] = topics
          .map((topic) => ({ ...topic, score: scoreTopicForUser(topic, profile) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, maxTopics);

        let models: RecommendedModel[] = [];
        let martechCategories: RecommendedVendorCategory[] = [];
        let resources: RecommendedResource[] = [];

        const topTopicIds = scoredTopics.map((t) => t.id);
        const topTopicCategoryKeys = [...new Set(scoredTopics.map((t) => t.category_key).filter(Boolean))] as string[];

        // If we have matching topics, fetch linked items
        if (topTopicIds.length > 0) {
          // Fetch models directly via topic_models
          const [linkedModels, linkedResourceCats] = await Promise.all([
            supabase.from('topic_models').select('model_id').in('topic_id', topTopicIds),
            supabase.from('topic_resource_categories').select('category_id').in('topic_id', topTopicIds),
          ]);

          const modelIds = [...new Set((linkedModels.data || []).map((l) => l.model_id))];
          const resourceCategoryIds = [...new Set((linkedResourceCats.data || []).map((l) => l.category_id))];

          // Fetch martech categories via the NEW linking tables
          // 1. Get martech categories linked directly to topics
          const martechCatsByTopic = await supabase
            .from('martech_category_topics')
            .select('martech_category_id')
            .in('topic_id', topTopicIds);

          // 2. Get martech categories linked via topic categories
          let martechCatsByTopicCategory: { data: { martech_category_id: string }[] | null } = { data: [] };
          if (topTopicCategoryKeys.length > 0) {
            // First get topic category IDs from keys
            const { data: topicCatData } = await supabase
              .from('topic_categories')
              .select('id')
              .in('key', topTopicCategoryKeys);
            
            const topicCategoryIds = (topicCatData || []).map(tc => tc.id);
            
            if (topicCategoryIds.length > 0) {
              martechCatsByTopicCategory = await supabase
                .from('martech_category_topic_categories')
                .select('martech_category_id')
                .in('topic_category_id', topicCategoryIds);
            }
          }

          const martechCategoryIds = [
            ...new Set([
              ...(martechCatsByTopic.data || []).map(l => l.martech_category_id),
              ...(martechCatsByTopicCategory.data || []).map(l => l.martech_category_id),
            ])
          ];

          // Fetch martech categories
          const martechCatsRes = martechCategoryIds.length > 0
            ? await supabase.from('martech_categories').select('id, name').in('id', martechCategoryIds)
            : { data: [] };

          // Fetch resources via category links
          const resourceLinks = resourceCategoryIds.length > 0
            ? await supabase.from('resource_category_links').select('resource_id').in('category_id', resourceCategoryIds)
            : { data: [] };

          const resourceIds = [...new Set((resourceLinks.data || []).map((l) => l.resource_id))];

          const [modelsRes, resourcesRes] = await Promise.all([
            modelIds.length > 0
              ? supabase.from('models').select('id, name, emoji, short_description, slug').in('id', modelIds).eq('status', 'active')
              : Promise.resolve({ data: [] }),
            resourceIds.length > 0
              ? supabase.from('resources').select('id, title, description, type, url, emoji, author, estimated_time').in('id', resourceIds).eq('status', 'active')
              : Promise.resolve({ data: [] }),
          ]);

          models = (modelsRes.data || []) as RecommendedModel[];
          martechCategories = (martechCatsRes.data || []) as RecommendedVendorCategory[];
          resources = (resourcesRes.data || []) as RecommendedResource[];
        }

        // If we have no recommendations, fetch random items as fallback
        const needsFallback = models.length === 0 && martechCategories.length === 0 && resources.length === 0;
        
        if (needsFallback) {
          const [randomModels, randomMartechCats, randomResources] = await Promise.all([
            supabase.from('models').select('id, name, emoji, short_description, slug').eq('status', 'active').limit(4),
            supabase.from('martech_categories').select('id, name').limit(4),
            supabase.from('resources').select('id, title, description, type, url, emoji, author, estimated_time').eq('status', 'active').limit(4),
          ]);

          // Shuffle and pick a mix
          const shuffleArray = <T,>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);
          
          models = shuffleArray(randomModels.data || []).slice(0, 3) as RecommendedModel[];
          martechCategories = shuffleArray(randomMartechCats.data || []).slice(0, 3) as RecommendedVendorCategory[];
          resources = shuffleArray(randomResources.data || []).slice(0, 3) as RecommendedResource[];
        }

        setRecommendations({
          topics: scoredTopics,
          models,
          martechCategories,
          resources,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchRecommendations();
  }, [maxTopics]);

  return recommendations;
}

// Helper function to get user profile and top topics for chatbot
export async function getUserRecommendationContext(userId: string): Promise<{
  profile: UserProfile | null;
  topTopics: { name: string; description: string | null; linkedModels: string[]; linkedCategories: { vendorCategories: string[]; resourceCategories: string[] } }[];
}> {
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('seniority, role_title, firm_size, firm_type, interest_areas, international_scope, growth_maturity_level, data_maturity_level')
      .eq('user_id', userId)
      .single();

    if (!profileData) {
      return { profile: null, topTopics: [] };
    }

    const profile: UserProfile = {
      seniority: profileData.seniority,
      role_title: profileData.role_title,
      firm_size: profileData.firm_size,
      firm_type: profileData.firm_type,
      interest_areas: profileData.interest_areas || [],
      international_scope: profileData.international_scope || false,
      growth_maturity_level: profileData.growth_maturity_level || 1,
      data_maturity_level: profileData.data_maturity_level || 1,
    };

    const { data: topicsData } = await supabase.from('topics').select('*').eq('active', true);
    const topics = (topicsData || []) as Topic[];

    const scoredTopics = topics
      .map((topic) => ({ ...topic, score: scoreTopicForUser(topic, profile) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const topTopics = await Promise.all(
      scoredTopics.map(async (topic) => {
        // Fetch linked models
        const linkedModels = await supabase
          .from('topic_models')
          .select('models(name)')
          .eq('topic_id', topic.id);

        // Fetch resource categories linked to the topic
        const resourceCats = await supabase
          .from('topic_resource_categories')
          .select('resource_categories(name)')
          .eq('topic_id', topic.id);

        // Fetch martech categories via the NEW linking tables
        const martechCatsByTopic = await supabase
          .from('martech_category_topics')
          .select('martech_categories(name)')
          .eq('topic_id', topic.id);

        // Also get martech categories linked via topic category
        let martechCatsByTopicCategory: any[] = [];
        if (topic.category_key) {
          const { data: topicCatData } = await supabase
            .from('topic_categories')
            .select('id')
            .eq('key', topic.category_key)
            .single();
          
          if (topicCatData) {
            const { data: cats } = await supabase
              .from('martech_category_topic_categories')
              .select('martech_categories(name)')
              .eq('topic_category_id', topicCatData.id);
            martechCatsByTopicCategory = cats || [];
          }
        }

        const vendorCategoryNames = [
          ...(martechCatsByTopic.data || []).map((c: any) => c.martech_categories?.name).filter(Boolean),
          ...martechCatsByTopicCategory.map((c: any) => c.martech_categories?.name).filter(Boolean),
        ];

        return {
          name: topic.name,
          description: topic.description,
          linkedModels: (linkedModels.data || []).map((m: any) => m.models?.name).filter(Boolean),
          linkedCategories: {
            vendorCategories: [...new Set(vendorCategoryNames)],
            resourceCategories: (resourceCats.data || []).map((c: any) => c.resource_categories?.name).filter(Boolean),
          },
        };
      })
    );

    return { profile, topTopics };
  } catch (error) {
    console.error('Error getting recommendation context:', error);
    return { profile: null, topTopics: [] };
  }
}
