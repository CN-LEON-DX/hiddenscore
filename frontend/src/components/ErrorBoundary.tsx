import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '';
      
      // Handle duplicate email error
      if (errorMessage.includes('duplicate key value') || 
          errorMessage.includes('users_email_key')) {
        return <Navigate to={`/error?message=${encodeURIComponent('This email is already registered. Please try logging in with your password.')}`} />;
      }

      // Handle other errors
      return <Navigate to={`/error?message=${encodeURIComponent(errorMessage)}`} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 