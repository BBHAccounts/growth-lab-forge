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

export interface RecommendedVendor {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

export interface RecommendedResearch {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
}

export interface Recommendations {
  topics: ScoredTopic[];
  models: RecommendedModel[];
  vendors: RecommendedVendor[];
  research: RecommendedResearch[];
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
    vendors: [],
    research: [],
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

        if (scoredTopics.length === 0) {
          setRecommendations({ topics: [], models: [], vendors: [], research: [], loading: false });
          return;
        }

        const topTopicIds = scoredTopics.map((t) => t.id);

        // Fetch linked content for top topics
        const [linkedModels, linkedVendors, linkedResearch] = await Promise.all([
          supabase.from('topic_models').select('model_id').in('topic_id', topTopicIds),
          supabase.from('topic_vendors').select('vendor_id').in('topic_id', topTopicIds),
          supabase.from('topic_research').select('research_id').in('topic_id', topTopicIds),
        ]);

        const modelIds = [...new Set((linkedModels.data || []).map((l) => l.model_id))];
        const vendorIds = [...new Set((linkedVendors.data || []).map((l) => l.vendor_id))];
        const researchIds = [...new Set((linkedResearch.data || []).map((l) => l.research_id))];

        // Fetch actual content
        const [modelsRes, vendorsRes, researchRes] = await Promise.all([
          modelIds.length > 0
            ? supabase.from('models').select('id, name, emoji, short_description, slug').in('id', modelIds).eq('status', 'active')
            : Promise.resolve({ data: [] }),
          vendorIds.length > 0
            ? supabase.from('vendors').select('id, name, description, logo_url').in('id', vendorIds)
            : Promise.resolve({ data: [] }),
          researchIds.length > 0
            ? supabase.from('research_studies').select('id, title, description, emoji').in('id', researchIds).eq('active', true)
            : Promise.resolve({ data: [] }),
        ]);

        setRecommendations({
          topics: scoredTopics,
          models: (modelsRes.data || []) as RecommendedModel[],
          vendors: (vendorsRes.data || []) as RecommendedVendor[],
          research: (researchRes.data || []) as RecommendedResearch[],
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
  topTopics: { name: string; description: string | null; linkedContent: { models: string[]; vendors: string[]; research: string[] } }[];
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
        const [models, vendors, research] = await Promise.all([
          supabase.from('topic_models').select('models(name)').eq('topic_id', topic.id),
          supabase.from('topic_vendors').select('vendors(name)').eq('topic_id', topic.id),
          supabase.from('topic_research').select('research_studies(title)').eq('topic_id', topic.id),
        ]);

        return {
          name: topic.name,
          description: topic.description,
          linkedContent: {
            models: (models.data || []).map((m: any) => m.models?.name).filter(Boolean),
            vendors: (vendors.data || []).map((v: any) => v.vendors?.name).filter(Boolean),
            research: (research.data || []).map((r: any) => r.research_studies?.title).filter(Boolean),
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
