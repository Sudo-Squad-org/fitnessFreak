import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Loader } from "@/components/common/Loader";

// Route-based code splitting — each page is a separate JS chunk loaded on demand
const Home = lazy(() => import("../pages/home/Home"));
const Login = lazy(() => import("../pages/auth/Login"));
const Signup = lazy(() => import("../pages/auth/Signup"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const Onboarding = lazy(() => import("../pages/onboarding/Onboarding"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Classes = lazy(() => import("../pages/booking/Classes"));
const AdminPanel = lazy(() => import("../pages/admin/AdminPanel"));
const Nutrition = lazy(() => import("../pages/nutrition/Nutrition"));
const Workout = lazy(() => import("../pages/workout/Workout"));
const Wellness = lazy(() => import("../pages/wellness/Wellness"));
const Goals = lazy(() => import("../pages/goals/Goals"));
const Progress = lazy(() => import("../pages/progress/Progress"));
const Profile = lazy(() => import("../pages/profile/Profile"));
const Community = lazy(() => import("../pages/community/Community"));

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
              </Route>

              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Onboarding — requires auth but not onboarding_completed */}
              <Route element={<ProtectedRoute skipOnboardingCheck />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/nutrition" element={<Nutrition />} />
                  <Route path="/workouts" element={<Workout />} />
                  <Route path="/wellness" element={<Wellness />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/community" element={<Community />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute requireAdmin />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
