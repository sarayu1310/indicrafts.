import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";

// Layout Components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

// Auth Pages
import Login from "./pages/auth/Login";
import CustomerRegister from "./pages/auth/CustomerRegister";
import ProducerRegister from "./pages/auth/ProducerRegister";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// User Pages
import Profile from "./pages/Profile";
import Wishlist from './pages/Wishlist';

// Producer Pages
import ProducerDashboard from "./pages/producer/Dashboard";
import ProductForm from "./pages/producer/ProductForm";
// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/Layout";
import OrdersPage from "./pages/admin/Orders";
import ApprovalsPage from "./pages/admin/Approvals";
import UsersPage from "./pages/admin/Users";
import ProducersPage from "./pages/admin/Producers";
import ReviewsPage from "./pages/admin/Reviews";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<AppLayout><Home /></AppLayout>} />
              <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
              <Route path="/product/:id" element={<AppLayout><ProductDetail /></AppLayout>} />
              <Route path="/about" element={<AppLayout><About /></AppLayout>} />
              <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
              <Route path="/cart" element={<AppLayout><Cart /></AppLayout>} />
              <Route path="/checkout" element={<AppLayout><Checkout /></AppLayout>} />

              {/* Auth Routes */}
              <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
              <Route path="/register/customer" element={<AppLayout><CustomerRegister /></AppLayout>} />
              <Route path="/register/producer" element={<AppLayout><ProducerRegister /></AppLayout>} />
              <Route path="/forgot-password" element={<AppLayout><ForgotPassword /></AppLayout>} />
              <Route path="/reset-password" element={<AppLayout><ResetPassword /></AppLayout>} />
              <Route path="/verify-email" element={<AppLayout><VerifyEmail /></AppLayout>} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <AppLayout>
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/producer/dashboard"
                element={
                  <AppLayout>
                    <ProtectedRoute requiredRole="producer">
                      <ProducerDashboard />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/producer/products/new"
                element={
                  <AppLayout>
                    <ProtectedRoute requiredRole="producer">
                      <ProductForm />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/producer/products/:id/edit"
                element={
                  <AppLayout>
                    <ProtectedRoute requiredRole="producer">
                      <ProductForm />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="producers" element={<ProducersPage />} />
              </Route>

              {/* Unauthorized */}
              <Route path="/unauthorized" element={<AppLayout><Unauthorized /></AppLayout>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
