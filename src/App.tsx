import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';

import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/hooks/use-toast.tsx';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Setup from '@/pages/setup';
import Styles from '@/pages/styles';
import Studio from '@/pages/studio';
import Edit from '@/pages/edit';
import Gallery from '@/pages/gallery';
import HowItWorks from '@/pages/how-it-works';
import Chat from '@/pages/chat';
import StudioLoading from '@/components/studio-loading';
import AuthPage from '@/pages/auth';
import ProfilePage from '@/pages/profile';
import AdminPage from '@/pages/admin';
import PrivacyPolicy from '@/pages/privacy-policy';
import TermsOfService from '@/pages/terms-of-service';
import { CookieNotice } from '@/components/cookie-notice';
import { ProtectedRoute } from '@/components/auth/protected-route';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/loading" component={StudioLoading} />
      <Route path="/get-started">
        {() => <Redirect to="/loading" />}
      </Route>
      <Route path="/setup" component={Setup} />
      <Route path="/styles" component={Styles} />
      <Route path="/studio" component={Studio} />
      <Route path="/edit" component={Edit} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/chat" component={Chat} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPage} requiredRole="admin" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
            <CookieNotice />
          </WouterRouter>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
