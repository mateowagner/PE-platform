import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TournamentsPage from "./pages/TournamentsPage";
import TeamPage from "./pages/TeamPage";
import AccountPage from "./pages/AccountPage";
import Navbar from "./components/layout/Navbar";
import TournamentDetailPage from "./pages/TournamentDetailPage";

// Guard para rutas privadas
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

// Guard para rutas públicas (evita ver login/landing si ya tenés sesión)
function PublicOnlyRoute() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

// Layout persistente que envuelve a las rutas privadas sin desmontar el Navbar
function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Solo accesibles sin sesión) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Rutas Privadas (Protegidas y con Layout persistente) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>

        {/* Redirección ante rutas no encontradas (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
