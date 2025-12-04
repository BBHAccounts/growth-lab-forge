import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Models from "./pages/Models";
import ModelDetail from "./pages/ModelDetail";
import ModelWorkspace from "./pages/ModelWorkspace";
import Martech from "./pages/Martech";
import Research from "./pages/Research";
import ResearchSurvey from "./pages/ResearchSurvey";
import About from "./pages/About";
import Account from "./pages/Account";
import InsightsHub from "./pages/InsightsHub";
import NotFound from "./pages/NotFound";

// Admin pages
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminModels from "./pages/admin/AdminModels";
import AdminModelForm from "./pages/admin/AdminModelForm";
import AdminResearch from "./pages/admin/AdminResearch";
import AdminResearchForm from "./pages/admin/AdminResearchForm";
import AdminResearchResponses from "./pages/admin/AdminResearchResponses";
import AdminMartech from "./pages/admin/AdminMartech";
import AdminVendorForm from "./pages/admin/AdminVendorForm";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTopics from "./pages/admin/AdminTopics";
import AdminTopicForm from "./pages/admin/AdminTopicForm";
import AdminResources from "./pages/admin/AdminResources";
import AdminResourceForm from "./pages/admin/AdminResourceForm";
import AdminNotifications from "./pages/admin/AdminNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/models" element={<Models />} />
          <Route path="/models/:id" element={<ModelDetail />} />
          <Route path="/models/:id/workspace" element={<ModelWorkspace />} />
          <Route path="/martech" element={<Martech />} />
          <Route path="/research" element={<Research />} />
          <Route path="/research/:studyId" element={<ResearchSurvey />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
          <Route path="/insights-hub" element={<InsightsHub />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRouteGuard><AdminOverview /></AdminRouteGuard>} />
          <Route path="/admin/users" element={<AdminRouteGuard><AdminUsers /></AdminRouteGuard>} />
          <Route path="/admin/users/:userId" element={<AdminRouteGuard><AdminUserDetail /></AdminRouteGuard>} />
          <Route path="/admin/models" element={<AdminRouteGuard><AdminModels /></AdminRouteGuard>} />
          <Route path="/admin/models/:modelId" element={<AdminRouteGuard><AdminModelForm /></AdminRouteGuard>} />
          <Route path="/admin/research" element={<AdminRouteGuard><AdminResearch /></AdminRouteGuard>} />
          <Route path="/admin/research/:studyId" element={<AdminRouteGuard><AdminResearchForm /></AdminRouteGuard>} />
          <Route path="/admin/research/:studyId/responses" element={<AdminRouteGuard><AdminResearchResponses /></AdminRouteGuard>} />
          <Route path="/admin/martech" element={<AdminRouteGuard><AdminMartech /></AdminRouteGuard>} />
          <Route path="/admin/martech/vendors/:vendorId" element={<AdminRouteGuard><AdminVendorForm /></AdminRouteGuard>} />
          <Route path="/admin/analytics" element={<AdminRouteGuard><AdminAnalytics /></AdminRouteGuard>} />
          <Route path="/admin/settings" element={<AdminRouteGuard><AdminSettings /></AdminRouteGuard>} />
          <Route path="/admin/notifications" element={<AdminRouteGuard><AdminNotifications /></AdminRouteGuard>} />
          <Route path="/admin/topics" element={<AdminRouteGuard><AdminTopics /></AdminRouteGuard>} />
          <Route path="/admin/topics/:topicId" element={<AdminRouteGuard><AdminTopicForm /></AdminRouteGuard>} />
          <Route path="/admin/insights-hub" element={<AdminRouteGuard><AdminResources /></AdminRouteGuard>} />
          <Route path="/admin/insights-hub/:resourceId" element={<AdminRouteGuard><AdminResourceForm /></AdminRouteGuard>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
