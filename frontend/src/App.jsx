// GoArts AI - Main Application Router & Shell
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared';

// Pages
import HomePage from './pages/HomePage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistProfilePage from './pages/ArtistProfilePage';
import AIPlannerPage from './pages/AIPlannerPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CustomerDashboard from './pages/CustomerDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import EventsBoardPage from './pages/EventsBoardPage';
// AI Ecosystem Pages (New)
import AIEcosystemPage from './pages/AIEcosystemPage';
import AIPosterCreatorPage from './pages/AIPosterCreatorPage';
import AISocialManagerPage from './pages/AISocialManagerPage';
import ArtistPremiumPage from './pages/ArtistPremiumPage';

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-md)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />

        <Routes>
          {/* Public Discovery Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/artists/:id" element={<ArtistProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/events" element={<EventsBoardPage />} />
          <Route path="/ai-planner" element={<AIPlannerPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Portal */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Artist Portal */}
          <Route
            path="/artist/dashboard"
            element={
              <ProtectedRoute role="artist">
                <ArtistDashboard />
              </ProtectedRoute>
            }
          />

          {/* Administrator Command Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* AI Ecosystem Routes (New) */}
          <Route path="/ai-ecosystem" element={<AIEcosystemPage />} />
          <Route path="/ai-poster" element={<AIPosterCreatorPage />} />
          <Route path="/ai-social" element={<AISocialManagerPage />} />
          <Route path="/premium" element={<ArtistPremiumPage />} />

          {/* Fallback & Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
