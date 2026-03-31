import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { CollectionsPage } from "./pages/CollectionsPage";
import { ProfileFeature } from './features/profile';
import { OrderHistory } from './features/profile/components/OrderHistory';
import { OrderDetail } from './features/profile/components/OrderDetail';
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import { PaymentResultPage } from "@/pages/PaymentResultPage";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AccountPage from "./pages/AccountPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ZodLocalizer } from "./components/i18n/ZodLocalizer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ZodLocalizer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/account" 
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfileFeature />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="saved" element={<div className="font-display italic text-2xl py-20 text-center text-primary/40">Saved Items Coming Soon</div>} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

