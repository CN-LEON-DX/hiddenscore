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
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for error in URL parameters
        const searchParams = new URLSearchParams(location.search);
        const errorType = searchParams.get('error');
        
        if (errorType === 'email_exists') {
            setError('This email is already registered with a password. Please use your email and password to log in.');
        } else if (errorType === 'auth_failed') {
            setError('Authentication failed. Please try again.');
        }
    }, [location]);

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        try {
            // Use the centralized authAPI utility
            import('../utils/api').then(({ authAPI }) => {
                authAPI.googleLogin();
            }).catch(err => {
                setErrors({
                    ...errors,
                    general: 'Failed to initiate Google login. Please try again.'
                });
                setIsLoading(false);
            });
        } catch (error) {
            setErrors({
                ...errors,
                general: 'Failed to initiate Google login. Please try again.'
            });
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name as keyof FormErrors]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
        // Also clear general errors
        if (errors.general) {
            setErrors({
                ...errors,
                general: ''
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
        
        // Clear previous errors
        setErrors({
            email: '',
            password: '',
            general: ''
        });
        
        // Validate form
        if (!validateForm()) {
            setIsLoading(false);
            return;
        }
        
        try {
            // Use the authAPI login method without any logging
            const { authAPI } = await import('../utils/api');
            await authAPI.login(formData.email, formData.password);
            
            // If we get here, login was successful - redirect to home
            navigate('/');
        } catch (error) {
            // No error logging at all
            
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data;
                
                if (errorData) {
                    switch (errorData.code) {
                        case 'GOOGLE_ACCOUNT':
                            setError(errorData.message || "This account uses Google Sign-In. Please use the Google button below.");
                            setErrors({...errors, general: ''});
                            break;
                        case 'EMAIL_NOT_CONFIRMED':
                            setError(errorData.message || "Please confirm your email before logging in.");
                            setErrors({...errors, general: ''});
                            break;
                        case 'INVALID_INPUT':
                            setError("Please enter a valid email and password.");
                            setErrors({...errors, general: ''});
                            break;
                        case 'AUTH_FAILED':
                            setError(errorData.message || "Invalid email or password.");
                            setErrors({...errors, general: ''});
                            break;
                        default:
                            setError(errorData.message || errorData.error || "An error occurred during login.");
                            setErrors({...errors, general: ''});
                    }
                } else {
                    setError('An unexpected error occurred. Please try again.');
                    setErrors({...errors, general: ''});
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
                setErrors({...errors, general: ''});
            }
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
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
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
                            <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                Forgot password?
                            </Link>
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