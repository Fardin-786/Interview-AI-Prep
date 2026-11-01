import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { Loader } from "./components/Loader/Loader";

// Lazy load pages for smaller initial JS bundle size and faster first page load
const Landing = lazy(() => import("./features/landing/pages/Landing"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const VerifyEmail = lazy(() => import("./features/auth/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPassword"));
const Protected = lazy(() => import("./features/auth/components/Protected"));
const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/Interview"));

const Loadable = (Component) => (props) => (
    <Suspense fallback={<Loader title="Loading Page..." message="Fetching view components..." />}>
        <Component {...props} />
    </Suspense>
);

const LandingPage = Loadable(Landing);
const LoginPage = Loadable(Login);
const RegisterPage = Loadable(Register);
const VerifyEmailPage = Loadable(VerifyEmail);
const ForgotPasswordPage = Loadable(ForgotPassword);
const ResetPasswordPage = Loadable(ResetPassword);
const HomePage = Loadable(Home);
const InterviewPage = Loadable(Interview);

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LandingPage />
    },
    {
        path: "/login",
        element: <LoginPage />
    },
    {
        path: "/register",
        element: <RegisterPage />
    },
    {
        path: "/verify-email",
        element: <VerifyEmailPage />
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />
    },
    {
        path: "/dashboard",
        element: <Suspense fallback={<Loader title="Loading Dashboard..." message="Verifying user session..." />}><Protected><HomePage /></Protected></Suspense>
    },
    {
        path: "/interview/:interviewId",
        element: <Suspense fallback={<Loader title="Loading Report..." message="Retrieving strategy details..." />}><Protected><InterviewPage /></Protected></Suspense>
    }
])