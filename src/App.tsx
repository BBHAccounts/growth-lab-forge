import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookRootEntry } from "./components/book/BookRootEntry";
import Auth from "./pages/Auth";
import ModelWorkspace from "./pages/ModelWorkspace";
import ModelDetail from "./pages/ModelDetail";
import ModelLibrary from "./pages/book/ModelLibrary";
import { LegacyModelRedirect } from "./components/book/LegacyModelRedirect";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import EmailVerified from "./pages/EmailVerified";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import BookJoin from "./pages/book/BookJoin";
import BookHome from "./pages/book/BookHome";
import BookVideo from "./pages/book/BookVideo";

// Admin pages
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUserForm from "./pages/admin/AdminUserForm";
import AdminModels from "./pages/admin/AdminModels";
import AdminModelForm from "./pages/admin/AdminModelForm";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminProgramForm from "./pages/admin/AdminProgramForm";
import AdminProgramResponses from "./pages/admin/AdminProgramResponses";
import AdminProgramReminders from "./pages/admin/AdminProgramReminders";
import ReminderProgrammes from "./pages/book/ReminderProgrammes";

// Program pages (participant-facing)

const queryClient = new QueryClient();

const App = () => (
  <div className="theme-book min-h-screen bg-background text-foreground"><QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BookRootEntry />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/book/join" element={<BookJoin />} />
          <Route path="/book/v/:stepId" element={<BookVideo />} />
          <Route path="/book" element={<BookHome />} />
          <Route path="/book/chapter/:chapterNumber" element={<BookHome />} />
          <Route path="/book/chapters" element={<BookHome />} />
          <Route path="/book/library" element={<ModelLibrary />} />
          <Route path="/book/library/:modelId" element={<ModelDetail />} />
          <Route path="/book/library/:modelId/workspace" element={<ModelWorkspace />} />
          <Route path="/book/tools" element={<LegacyModelRedirect />} />
          <Route path="/book/notes" element={<BookHome />} />
          <Route path="/book/reminders" element={<ReminderProgrammes />} />
          <Route path="/book/reminders/:programId" element={<AdminProgramReminders coordinator />} />
          <Route path="/book/tools/:modelId" element={<LegacyModelRedirect />} />
          <Route path="/models" element={<LegacyModelRedirect />} />
          <Route path="/models/:id" element={<LegacyModelRedirect />} />
          <Route path="/models/:id/workspace" element={<LegacyModelRedirect workspace />} />
          <Route path="/account" element={<Account />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRouteGuard><AdminOverview /></AdminRouteGuard>} />
          <Route path="/admin/users" element={<AdminRouteGuard><AdminUsers /></AdminRouteGuard>} />
          <Route path="/admin/users/new" element={<AdminRouteGuard><AdminUserForm /></AdminRouteGuard>} />
          <Route path="/admin/users/:userId" element={<AdminRouteGuard><AdminUserDetail /></AdminRouteGuard>} />
          <Route path="/admin/models" element={<AdminRouteGuard><AdminModels /></AdminRouteGuard>} />
          <Route path="/admin/models/:modelId" element={<AdminRouteGuard><AdminModelForm /></AdminRouteGuard>} />
          <Route path="/admin/settings" element={<AdminRouteGuard><AdminSettings /></AdminRouteGuard>} />
          <Route path="/admin/programs" element={<AdminRouteGuard><AdminPrograms /></AdminRouteGuard>} />
          <Route path="/admin/programs/:programId" element={<AdminRouteGuard><AdminProgramForm /></AdminRouteGuard>} />
          <Route path="/admin/programs/:programId/responses" element={<AdminRouteGuard><AdminProgramResponses /></AdminRouteGuard>} />
          <Route path="/admin/programs/:programId/reminders" element={<AdminRouteGuard><AdminProgramReminders /></AdminRouteGuard>} />
          
          {/* Program Routes (public, participant-facing) */}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider></div>
);

export default App;
