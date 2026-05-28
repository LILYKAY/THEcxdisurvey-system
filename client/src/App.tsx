import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import SurveyPage from "./pages/SurveyPage";
import SurveyComplete from "./pages/SurveyComplete";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminRespondents from "./pages/admin/AdminRespondents";
import AdminSurveyInsights from "./pages/admin/AdminSurveyInsights";
import AdminSurveys from "./pages/admin/AdminSurveys";
import AdminRespondentDetail from "./pages/admin/AdminRespondentDetail";
import OrgDashboard from "./pages/org/OrgDashboard";
import OrgRespondents from "./pages/org/OrgRespondents";
import OrgRespondentDetail from "./pages/org/OrgRespondentDetail";
import OrgSurveyInsights from "./pages/org/OrgSurveyInsights";
import OrgSettings from "./pages/org/OrgSettings";
import OrgInvite from "./pages/org/OrgInvite";
import OrgInvitations from "./pages/org/OrgInvitations";
import OrgReports from "./pages/org/OrgReports";
import OrgCustomQuestions from "./pages/org/OrgCustomQuestions";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrgSelect from "./pages/OrgSelect";

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/org-select" component={OrgSelect} />

      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/s/:token" component={SurveyPage} />
      <Route path="/survey-complete" component={SurveyComplete} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/organizations" component={AdminOrganizations} />
      <Route path="/admin/respondents" component={AdminRespondents} />
      <Route path="/admin/respondents/:id" component={AdminRespondentDetail} />
      <Route path="/admin/surveys" component={AdminSurveys} />
      <Route path="/admin/surveys/:id/insights" component={AdminSurveyInsights} />

      {/* Org Owner */}
      <Route path="/org/:orgId" component={OrgDashboard} />
      <Route path="/org/:orgId/respondents" component={OrgRespondents} />
      <Route path="/org/:orgId/respondents/:respondentId" component={OrgRespondentDetail} />
      <Route path="/org/:orgId/surveys/:surveyId/insights" component={OrgSurveyInsights} />
      <Route path="/org/:orgId/settings" component={OrgSettings} />
      <Route path="/org/:orgId/invite" component={OrgInvite} />
      <Route path="/org/:orgId/invitations" component={OrgInvitations} />
      <Route path="/org/:orgId/reports" component={OrgReports} />
      <Route path="/org/:orgId/surveys/:surveyId/questions" component={OrgCustomQuestions} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
