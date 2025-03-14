import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import api from '../utils/api';
import axios from 'axios';

export default function ConfirmEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');
    const token = searchParams.get('token');

    useEffect(() => {
        const confirmEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid confirmation link. No token provided.');
                return;
            }

            try {
                const response = await api.get('/auth/confirm', {
                    params: { token }
                });

                setStatus('success');
                setMessage('Your email has been successfully confirmed! You will be redirected to the login page in a few seconds...');
                
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            } catch (error) {
                console.error('Error confirming email:', error);
                
                if (axios.isAxiosError(error) && error.response) {
                    setMessage(error.response.data?.error || 'Email confirmation failed. Please try again.');
                } else {
                    setMessage(error instanceof Error ? error.message : 'Email confirmation failed. Please try again.');
                }
                
                setStatus('error');
            }
        };

        confirmEmail();
    }, [token, navigate]);

    return (
        <>
            <Helmet>
                <title>Confirm Email</title>
            </Helmet>
            <div className="flex min-h-screen flex-col items-center justify-center px-6">
                <div className="mx-auto w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                    <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">Email Verification</h1>
                    
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="text-center text-gray-600">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <p className="text-gray-600">{message}</p>
                            <p className="mt-4 text-sm text-gray-500">Redirecting to login page...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <p className="text-gray-600">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
} 