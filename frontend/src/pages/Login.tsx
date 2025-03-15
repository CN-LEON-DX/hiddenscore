import { useState, useEffect } from "react";
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import api from '../utils/api';
import axios, { AxiosError } from 'axios';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

type FormData = {
    email: string;
    password: string;
}

type FormErrors = {
    email: string;
    password: string;
    general: string;
}

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<FormErrors>({
        email: '',
        password: '',
        general: ''
    });
    const { register, handleSubmit } = useForm<FormData>();

    useEffect(() => {
        // Kiểm tra nếu có thông báo lỗi từ URL
        const params = new URLSearchParams(location.search);
        const errorType = params.get('error');
        
        if (errorType === 'email_exists') {
            setErrors({
                ...errors,
                general: 'This email is already registered. Please try logging in with your password or use a different email.'
            });
        }
    }, [location]);

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        try {
            // Redirect to Google login with correct callback URL
            window.location.href = `/api/auth/google/login?redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}`;
        } catch (error) {
            console.error("Google sign-in error:", error);
            setErrors({
                ...errors,
                general: 'Failed to initiate Google login. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error when user types
        if (errors[name as keyof FormErrors]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = { ...errors };

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        
        setErrors({
            email: '',
            password: '',
            general: ''
        });
        
        if (!validateForm()) {
            setIsLoading(false);
            return;
        }
        
        try {
            const loginResponse = await api.post('/auth/login', data);
            navigate('/');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error;
                if (errorMessage) {
                    throw new Error(errorMessage); // Let ErrorBoundary handle the error
                }
            }
            setErrors({
                ...errors,
                general: 'An unexpected error occurred. Please try again.'
            });
            console.error('Error during login:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Login</title>
            </Helmet>
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <a href="/">
                        <img
                            alt="Your Company"
                            src="/logo.svg"
                            className="mx-auto h-10 w-auto"
                        />
                    </a>
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="email"
                                    className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.email ? 'outline-red-500' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ${errors.password ? 'outline-red-500' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"/>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <FaGoogle className="h-5 w-5 text-red-500" />
                                Sign in with Google
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col space-y-2">
                        <p className="text-center text-sm text-gray-600">
                            <a href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                Forgot password?
                            </a>
                        </p>

                        <p className="text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}