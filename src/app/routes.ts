import { createBrowserRouter } from 'react-router';
import Root from './Root';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import GateControl from './pages/GateControl';
import VisitorRegistration from './pages/VisitorRegistration';
import Visitors from './pages/Visitors';
import EntryLogs from './pages/EntryLogs';
import Alerts from './pages/Alerts';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import Recent from './pages/Recent';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/admin',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'gate-control', Component: GateControl },
      { path: 'visitors', Component: Visitors },
      { path: 'entry-logs', Component: EntryLogs },
      { path: 'recent', Component: Recent },
      { path: 'alerts', Component: Alerts },
      { path: 'employees', Component: Employees },
      { path: 'settings', Component: Settings },
    ],
  },
  {
    path: '/visitor-registration',
    Component: VisitorRegistration,
  },
]);