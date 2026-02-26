import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Box, Heart, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  userStats: {
    total: number;
    last30Days: number;
    last7Days: number;
  };
  modelStats: {
    total: number;
    totalActivations: number;
    topActivated: { name: string; count: number }[];
  };
  researchStats: {
    totalStudies: number;
    totalResponses: number;
    completionRate: number;
  };
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // User stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: users30Days } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: users7Days } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Model stats
        const { count: totalModels } = await supabase
          .from('models')
          .select('*', { count: 'exact', head: true });

        const { count: totalActivations } = await supabase
          .from('activated_models')
          .select('*', { count: 'exact', head: true });

        const { data: activatedModels } = await supabase
          .from('activated_models')
          .select('model_id, models(name)');

        const modelCounts: Record<string, { name: string; count: number }> = {};
        activatedModels?.forEach((am) => {
          const name = (am.models as { name: string } | null)?.name || 'Unknown';
          if (!modelCounts[am.model_id]) {
            modelCounts[am.model_id] = { name, count: 0 };
          }
          modelCounts[am.model_id].count++;
        });

        const topActivated = Object.values(modelCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);




        // Research stats
        const { count: totalStudies } = await supabase
          .from('research_studies')
          .select('*', { count: 'exact', head: true });

        const { count: totalResponses } = await supabase
          .from('research_responses')
          .select('*', { count: 'exact', head: true });

        const { count: completedResponses } = await supabase
          .from('research_responses')
          .select('*', { count: 'exact', head: true })
          .eq('completed', true);

        const completionRate =
          totalResponses && totalResponses > 0
            ? Math.round(((completedResponses || 0) / totalResponses) * 100)
            : 0;

        setData({
          userStats: {
            total: totalUsers || 0,
            last30Days: users30Days || 0,
            last7Days: users7Days || 0,
          },
          modelStats: {
            total: totalModels || 0,
            totalActivations: totalActivations || 0,
            topActivated,
          },
          vendorStats: {
            total: totalVendors || 0,
            topLiked,
          },
          researchStats: {
            totalStudies: totalStudies || 0,
            totalResponses: totalResponses || 0,
            completionRate,
          },
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading analytics...</p>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Failed to load analytics</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform usage insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.userStats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{data.userStats.last7Days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model Activations</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.modelStats.totalActivations}</div>
              <p className="text-xs text-muted-foreground">
                across {data.modelStats.total} models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Martech Vendors</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.vendorStats.total}</div>
              <p className="text-xs text-muted-foreground">in catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.researchStats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {data.researchStats.totalResponses} responses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 7 days</span>
                <span className="font-medium">{data.userStats.last7Days} new users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 30 days</span>
                <span className="font-medium">{data.userStats.last30Days} new users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total registered</span>
                <span className="font-medium">{data.userStats.total} users</span>
              </div>
            </CardContent>
          </Card>

          {/* Research Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Research Lab</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active studies</span>
                <span className="font-medium">{data.researchStats.totalStudies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total responses</span>
                <span className="font-medium">{data.researchStats.totalResponses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-medium">{data.researchStats.completionRate}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Models */}
          <Card>
            <CardHeader>
              <CardTitle>Top Activated Models</CardTitle>
            </CardHeader>
            <CardContent>
              {data.modelStats.topActivated.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.modelStats.topActivated.map((model, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                        <span className="text-sm">{model.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{model.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Most Liked Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {data.vendorStats.topLiked.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.vendorStats.topLiked.map((vendor, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                        <span className="text-sm">{vendor.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{vendor.likes} ❤️</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
