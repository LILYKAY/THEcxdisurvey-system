import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Auth pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrgSelect from "./pages/OrgSelect";

// Survey taking
import SurveyPage from "./pages/SurveyPage";
import SurveyComplete from "./pages/SurveyComplete";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminRespondents from "./pages/admin/AdminRespondents";
import AdminSurveyInsights from "./pages/admin/AdminSurveyInsights";
import AdminSurveys from "./pages/admin/AdminSurveys";
import AdminRespondentDetail from "./pages/admin/AdminRespondentDetail";

// Org pages
import OrgDashboard from "./pages/org/OrgDashboard";
import OrgRespondents from "./pages/org/OrgRespondents";
import OrgRespondentDetail from "./pages/org/OrgRespondentDetail";
import OrgSettings from "./pages/org/OrgSettings";
import OrgContacts from "./pages/org/OrgContacts";
import OrgAudiences from "./pages/org/OrgAudiences";
import OrgSurveys from "./pages/org/OrgSurveys";
import OrgSurveyBuilder from "./pages/org/OrgSurveyBuilder";
import OrgSendSurvey from "./pages/org/OrgSendSurvey";
import OrgEmailBranding from "./pages/org/OrgEmailBranding";
import OrgAnalytics from "./pages/org/OrgAnalytics";

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
      <Route path="/survey/:token" component={SurveyPage} />
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
      <Route path="/org/:orgId/surveys" component={OrgSurveys} />
      <Route path="/org/:orgId/surveys/:surveyId/builder" component={OrgSurveyBuilder} />
      <Route path="/org/:orgId/surveys/:surveyId/send" component={OrgSendSurvey} />
      <Route path="/org/:orgId/surveys/:surveyId/analytics" component={OrgAnalytics} />
      <Route path="/org/:orgId/contacts" component={OrgContacts} />
      <Route path="/org/:orgId/audiences" component={OrgAudiences} />
      <Route path="/org/:orgId/respondents" component={OrgRespondents} />
      <Route path="/org/:orgId/respondents/:respondentId" component={OrgRespondentDetail} />
      <Route path="/org/:orgId/branding" component={OrgEmailBranding} />
      <Route path="/org/:orgId/settings" component={OrgSettings} />

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
