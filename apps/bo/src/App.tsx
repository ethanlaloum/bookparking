import { Navigate, Route, Routes } from 'react-router-dom';

import { ConsoleLayout } from './components/ConsoleLayout';
import { ConsoleSection } from './components/ConsoleSection';
import { AdminAccountsPanel } from './pages/AdminAccountsPanel';
import { AdminIssuesPanel } from './pages/AdminIssuesPanel';
import { AdminJournalPanel } from './pages/AdminJournalPanel';
import { AdminListingsPanel } from './pages/AdminListingsPanel';
import { AdminOverviewPanel } from './pages/AdminOverviewPanel';
import { AdminRequestsPanel } from './pages/AdminRequestsPanel';
import { AdminSettingsPanel } from './pages/AdminSettingsPanel';
import { SignInPage } from './pages/SignInPage';
import { RequireSession } from './routes/RequireSession';

export const App = () => (
  <Routes>
    <Route path="/connexion" element={<SignInPage />} />
    <Route element={<RequireSession />}>
      <Route element={<ConsoleLayout />}>
        <Route
          index
          element={
            <ConsoleSection name="overview">
              <AdminOverviewPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="reclamations"
          element={
            <ConsoleSection name="issues">
              <AdminIssuesPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="comptes"
          element={
            <ConsoleSection name="accounts">
              <AdminAccountsPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="annonces"
          element={
            <ConsoleSection name="listings">
              <AdminListingsPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="demandes"
          element={
            <ConsoleSection name="requests">
              <AdminRequestsPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="reglages"
          element={
            <ConsoleSection name="settings">
              <AdminSettingsPanel />
            </ConsoleSection>
          }
        />
        <Route
          path="journal"
          element={
            <ConsoleSection name="journal">
              <AdminJournalPanel />
            </ConsoleSection>
          }
        />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
