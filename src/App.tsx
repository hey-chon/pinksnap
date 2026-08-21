import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';

import { AppProvider } from '@/lib/store';
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
