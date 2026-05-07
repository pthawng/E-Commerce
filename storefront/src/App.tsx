import { lazy, Suspense } from "react";
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ZodLocalizer } from "./components/i18n/ZodLocalizer";
import { ScrollToAnchor } from "@/components/utils/ScrollToAnchor";
import { ErrorBoundary } from "@/components/utils/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Performance Optimization: Route-based code splitting
const Index = lazy(() => import("@/pages/Index"));
const CollectionsPage = lazy(() => import("@/pages/CollectionsPage").then(m => ({ default: m.CollectionsPage })));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage").then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import("@/pages/CartPage").then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PaymentResultPage = lazy(() => import("@/pages/PaymentResultPage").then(m => ({ default: m.PaymentResultPage })));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Feature sub-routes
const ProfileFeature = lazy(() => import("@/features/profile").then(m => ({ default: m.ProfileFeature })));
const OrderHistory = lazy(() => import("@/features/profile/components/OrderHistory").then(m => ({ default: m.OrderHistory })));
const OrderDetail = lazy(() => import("@/features/profile/components/OrderDetail").then(m => ({ default: m.OrderDetail })));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount, error: any) => {
        if (error?.statusCode === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const RouteLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
    <div className="relative">
      <div className="h-10 w-10 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
      <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
    </div>
    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground italic">Restoring Elegance</p>
  </div>
);

const App = () => (
  <HelmetProvider>
    <Helmet>
      <title>Ray Paradis | Timeless Luxury Jewelry</title>
      <meta name="description" content="Exquisite high jewelry crafted with passion and precision. Discover the art of timeless elegance." />
    </Helmet>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ZodLocalizer />
          <Toaster />
          <Sonner position="top-right" expand={true} richColors />
          <BrowserRouter>
            <ScrollToAnchor />
              <Routes>
                <Route path="/" element={<Suspense fallback={<RouteLoader />}><Index /></Suspense>} />
                <Route path="/collections" element={<Suspense fallback={<RouteLoader />}><CollectionsPage /></Suspense>} />
                <Route path="/product/:slug" element={<Suspense fallback={<RouteLoader />}><ProductDetailPage /></Suspense>} />
                <Route path="/cart" element={<Suspense fallback={<RouteLoader />}><CartPage /></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<RouteLoader />}><CheckoutPage /></Suspense>} />
                <Route path="/payment-result" element={<Suspense fallback={<RouteLoader />}><PaymentResultPage /></Suspense>} />
                <Route path="/reset-password" element={<Suspense fallback={<RouteLoader />}><ResetPassword /></Suspense>} />
                <Route path="/verify-email" element={<Suspense fallback={<RouteLoader />}><VerifyEmail /></Suspense>} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<RouteLoader />}><AccountPage /></Suspense>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Suspense fallback={<RouteLoader />}><ProfileFeature /></Suspense>} />
                  <Route path="orders" element={<Suspense fallback={<RouteLoader />}><OrderHistory /></Suspense>} />
                  <Route path="orders/:id" element={<Suspense fallback={<RouteLoader />}><OrderDetail /></Suspense>} />
                  <Route path="saved" element={<div className="font-display italic text-2xl py-20 text-center text-primary/40">Saved Items Coming Soon</div>} />
                </Route>

                <Route path="/privacy" element={<Suspense fallback={<RouteLoader />}><PrivacyPage /></Suspense>} />
                <Route path="/terms" element={<Suspense fallback={<RouteLoader />}><TermsPage /></Suspense>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<Suspense fallback={<RouteLoader />}><NotFound /></Suspense>} />
              </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;

