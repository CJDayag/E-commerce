import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/app-header';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children?: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const { user, isLoading } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-lg font-medium text-gray-600">Loading content...</p>
                <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the data</p>
            </div>
        );
    }

    // Redirect to log in if not authenticated
    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <AppHeader />
            <main>
                {children || <Outlet />}
            </main>
        </div>
    );
}