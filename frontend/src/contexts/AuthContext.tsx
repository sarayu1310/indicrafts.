import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';
import axios from "axios";

interface User {
    id: string;
    _id?: string; // MongoDB _id (may be present in some API responses)
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    role: 'customer' | 'producer' | 'admin';
    isEmailVerified: boolean;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, role?: 'customer' | 'producer' | 'admin') => Promise<void>;
    // register: (userData: RegisterData) => Promise<void>;
    register: (formData: FormData) => Promise<void>;
    logout: () => void;
    verifyEmail: (token: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'customer' | 'producer';
    phone?: string;
    // Producer-specific optional fields
    businessName?: string;
    location?: string;
    craftType?: string;
    experience?: number | string;
    yearsOfExperience?: number | string;
    story?: string;
    productTypes?: string[];
    // Producer bank details (optional)
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
    bankBranch?: string;
    // Certificate file (required for producer)
    certificate?: File;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

function getStorageKeyForPath(): string {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        if (path.startsWith('/admin')) return 'admin_token';
        if (path.startsWith('/producer')) return 'producer_token';
    }
    return 'customer_token';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem(getStorageKeyForPath()));
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!token;

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem(getStorageKeyForPath());
            if (storedToken) {
                try {
                    const response = await apiService.getProfile();
                    setUser(response.user);
                    setToken(storedToken);
                } catch (error: any) {
                    // Only clear token on explicit 401; ignore transient dev errors (e.g., server restart)
                    if (error?.status === 401) {
                        localStorage.removeItem(getStorageKeyForPath());
                        setToken(null);
                        setUser(null);
                    }
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string, role?: 'customer' | 'producer' | 'admin') => {
        try {
            setIsLoading(true);
            const response = await apiService.login({ email, password, role });

            if (response.token && response.user) {
                const key = role === 'admin' ? 'admin_token' : role === 'producer' ? 'producer_token' : 'customer_token';
                localStorage.setItem(key, response.token);
                setToken(response.token);
                setUser(response.user);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // const register = async (userData: RegisterData) => {
    //     try {
    //         setIsLoading(true);
    //         const response = await apiService.register(userData);

    //         if (response.user) {
    //             setUser(response.user);
    //             // Don't set token here as user needs to verify email first
    //         } else {
    //             throw new Error('Invalid response from server');
    //         }
    //     } catch (error) {
    //         console.error('Registration error:', error);
    //         throw error;
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const register = async (formData: FormData) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { message: "Registration failed" };
  }
};


    const logout = () => {
        localStorage.removeItem(getStorageKeyForPath());
        setToken(null);
        setUser(null);
    };

    const verifyEmail = async (token: string) => {
        try {
            setIsLoading(true);
            await apiService.verifyEmail(token);
            // Refresh user profile to get updated verification status
            if (user) {
                await refreshProfile();
            }
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            setIsLoading(true);
            await apiService.forgotPassword(email);
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (token: string, password: string) => {
        try {
            setIsLoading(true);
            await apiService.resetPassword(token, password);
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (userData: Partial<User>) => {
        try {
            setIsLoading(true);
            const response = await apiService.updateProfile({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
            });

            if (response.user) {
                setUser(response.user);
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshProfile = async () => {
        try {
            const response = await apiService.getProfile();
            setUser(response.user);
        } catch (error: any) {
            console.error('Refresh profile error:', error);
            if (error?.status === 401) {
                logout();
            }
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        updateProfile,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
