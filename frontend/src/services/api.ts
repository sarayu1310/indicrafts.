const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  message: string;
  user?: any;
  token?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = VITE_API_BASE_URL;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const err: any = new Error(data.message || 'An error occurred');
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Simple helpers
  async get<T = any>(endpoint: string): Promise<any> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<any> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // Auth endpoints
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'customer' | 'producer';
    phone?: string;
    // producer-specific
    businessName?: string;
    location?: string;
    craftType?: string;
    experience?: number | string;
    story?: string;
    productTypes?: string[];
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
    role?: 'customer' | 'producer' | 'admin';
  }): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/auth/profile');
  }

  async updateProfile(userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Contact endpoints
  async submitContact(contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse> {
    return this.request('/contact/submit', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getContacts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return this.request(`/contact${queryString ? `?${queryString}` : ''}`);
  }

  async getContactById(id: string): Promise<ApiResponse> {
    return this.request(`/contact/${id}`);
  }

  async updateContactStatus(id: string, data: {
    status?: string;
    priority?: string;
    response?: string;
  }): Promise<ApiResponse> {
    return this.request(`/contact/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string): Promise<ApiResponse> {
    return this.request(`/contact/${id}`, {
      method: 'DELETE',
    });
  }

  async getContactStats(): Promise<ApiResponse> {
    return this.request('/contact/stats');
  }

  // Products
  async listProducts(): Promise<ApiResponse<{ products: any[] }>> {
    return this.request('/products');
  }

  async getProductById(id: string): Promise<ApiResponse<{ product: any }>> {
    return this.request(`/products/${id}`);
  }

  async createProduct(formData: FormData): Promise<ApiResponse<{ product: any }>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/products`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }
    return data;
  }

  async listMyProducts(): Promise<ApiResponse<{ products: any[] }>> {
    return this.request('/products/mine');
  }

  async updateProduct(id: string, payload: FormData | Record<string, any>): Promise<ApiResponse<{ product: any }>> {
    const token = localStorage.getItem('token');
    let response: Response;
    if (payload instanceof FormData) {
      response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'PUT',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: payload,
      });
    } else {
      response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update product');
    return data;
  }

  async deleteProduct(id: string): Promise<ApiResponse> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Admin endpoints
  async getAdminStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request('/admin/stats');
  }

  async getAdminOrders(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<{ orders: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    const qs = queryParams.toString();
    return this.request(`/admin/orders${qs ? `?${qs}` : ''}`);
  }

  async getAdminOrderById(id: string): Promise<ApiResponse<{ order: any }>> {
    return this.request(`/admin/orders/${id}`);
  }

  async getAdminProducts(params?: { page?: number; limit?: number; status?: 'pending' | 'approved' | 'rejected' }): Promise<ApiResponse<{ products: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    const qs = queryParams.toString();
    return this.request(`/admin/products${qs ? `?${qs}` : ''}`);
  }

  async approveAdminProduct(id: string, notes?: string): Promise<ApiResponse<{ product: any }>> {
    return this.request(`/admin/products/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectAdminProduct(id: string, notes?: string): Promise<ApiResponse<{ product: any }>> {
    return this.request(`/admin/products/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Admin users
  async getAdminUsers(params?: { page?: number; limit?: number; role?: 'customer' | 'producer' | 'admin'; search?: string }): Promise<ApiResponse<{ users: any[]; total: number; page: number; limit: number }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    const qs = queryParams.toString();
    return this.request(`/admin/users${qs ? `?${qs}` : ''}`);
  }

  async getAdminUserById(id: string): Promise<ApiResponse<{ user: any }>> {
    return this.request(`/admin/users/${id}`);
  }

  // Payments (Razorpay)
  async getRazorpayKey(): Promise<{ keyId: string }> {
    const fromEnv = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
    if (fromEnv) return { keyId: fromEnv };
    const res = await this.request<{ keyId: string }>(`/payments/key`);
    // request() wraps as ApiResponse, but backend may return plain { keyId }.
    // @ts-ignore
    return (res && (res as any).keyId) ? (res as any) : (res as unknown as { keyId: string });
  }

  async createPaymentOrder(payload: {
    amount: number; // in paise
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    // Backend returns Razorpay order object
    // bailing from ApiResponse typing to keep original shape
    const url = `${this.baseURL}/payments/create-order`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create payment order');
    return data;
  }

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ message: string; orderId: string; paymentId: string }> {
    const url = `${this.baseURL}/payments/verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment verification failed');
    return data;
  }

  async confirmPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    cart: { items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }> };
    address: any;
    totals: { subtotal: number; shipping?: number; total: number };
    currency?: string;
  }): Promise<{ message: string; order: any }> {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }) as unknown as Promise<{ message: string; order: any }>;
  }

  // Wishlist
  async getWishlist(): Promise<ApiResponse<{ wishlist: any[] }>> {
    return this.request('/auth/wishlist');
  }

  async addToWishlist(productId: string): Promise<ApiResponse<{ wishlist: any[] }>> {
    return this.request(`/auth/wishlist/${productId}`, { method: 'POST' });
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse<{ wishlist: any[] }>> {
    return this.request(`/auth/wishlist/${productId}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
export default apiService;
