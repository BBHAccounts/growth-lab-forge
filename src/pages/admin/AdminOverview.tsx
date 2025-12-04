import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Box, Heart, FlaskConical } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalModels: number;
  totalMartechCategories: number;
  totalVendors: number;
  topModels: { name: string; count: number }[];
  topLikedModels: { name: string; likes: number }[];
  topVendors: { name: string; likes: number }[];
  researchParticipation: { title: string; responses: number }[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalModels: 0,
    totalMartechCategories: 0,
    totalVendors: 0,
    topModels: [],
    topLikedModels: [],
    topVendors: [],
    researchParticipation: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts in parallel
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
          { count: totalUsers },
          { count: activeUsers },
          { count: totalModels },
          { count: totalMartechCategories },
          { count: totalVendors },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo.toISOString()),
          supabase.from('models').select('*', { count: 'exact', head: true }),
          supabase.from('martech_categories').select('*', { count: 'exact', head: true }),
          supabase.from('vendors').select('*', { count: 'exact', head: true }),
        ]);

        // Top activated models
        const { data: activatedModels } = await supabase
          .from('activated_models')
          .select('model_id, models(name)')
          .limit(100);

        const modelCounts: Record<string, { name: string; count: number }> = {};
        activatedModels?.forEach((am) => {
          const modelName = (am.models as { name: string } | null)?.name || 'Unknown';
          if (!modelCounts[am.model_id]) {
            modelCounts[am.model_id] = { name: modelName, count: 0 };
          }
          modelCounts[am.model_id].count++;
        });
        const topModels = Object.values(modelCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top liked models
        const { data: likedModels } = await supabase
          .from('models')
          .select('name, likes_count')
          .order('likes_count', { ascending: false })
          .limit(5);

        const topLikedModels = likedModels?.map((m) => ({
          name: m.name,
          likes: m.likes_count || 0,
        })) || [];

        // Top liked vendors
        const { data: likedVendors } = await supabase
          .from('vendors')
          .select('name, likes_count')
          .order('likes_count', { ascending: false })
          .limit(5);

        const topVendors = likedVendors?.map((v) => ({
          name: v.name,
          likes: v.likes_count || 0,
        })) || [];

        // Research participation
        const { data: studies } = await supabase
          .from('research_studies')
          .select('id, title');

        const researchParticipation = await Promise.all(
          (studies || []).map(async (study) => {
            const { count } = await supabase
              .from('research_responses')
              .select('*', { count: 'exact', head: true })
              .eq('study_id', study.id);
            return { title: study.title, responses: count || 0 };
          })
        );

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalModels: totalModels || 0,
          totalMartechCategories: totalMartechCategories || 0,
          totalVendors: totalVendors || 0,
          topModels,
          topLikedModels,
          topVendors,
          researchParticipation,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-muted-foreground">Admin dashboard overview</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Models</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalModels}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Martech Categories</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalMartechCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVendors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Studies</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.researchParticipation.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Lists */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Activated Models</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : stats.topModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topModels.map((model, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{model.name}</span>
                      <span className="text-muted-foreground">{model.count} users</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" /> Most Liked Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : stats.topLikedModels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topLikedModels.map((model, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{model.name}</span>
                      <span className="text-muted-foreground">{model.likes} likes</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" /> Top Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : stats.topVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topVendors.map((vendor, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{vendor.name}</span>
                      <span className="text-muted-foreground">{vendor.likes} likes</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Research Participation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Research Participation</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : stats.researchParticipation.length === 0 ? (
              <p className="text-sm text-muted-foreground">No research studies yet</p>
            ) : (
              <ul className="space-y-2">
                {stats.researchParticipation.map((study, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{study.title}</span>
                    <span className="text-muted-foreground">{study.responses} responses</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
