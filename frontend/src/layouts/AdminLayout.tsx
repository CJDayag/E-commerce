import { ReactNode } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { type NavItem } from '@/types';
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Heading from '@/components/heading';
import { LogOut } from 'lucide-react'; // Import LogOut icon
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
    children?: ReactNode; // Make children optional
}

const sidebarNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: null
    },
    {
        title: 'Analytics',
        href: '/admin/analytics',
    },
    {
        title: 'Product',
        href: '/admin/productmanagement',
        icon: null
    },
    {
        title: 'Orders',
        href: '/admin/orders',
        icon: null
    }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
    const currentPath = window.location.pathname;
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            // Call the logout function from AuthContext
            // This already handles clearing tokens from localStorage
            await logout();

            // Show success message
            toast.success('You have been successfully logged out');

            // Redirect to login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('There was a problem logging out');

            // Just to be safe, try to clear tokens directly as a fallback
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');

            navigate('/login');
        }
    };


    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b py-2 shadow-sm">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="text-xl font-semibold" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-1"
                    >
                        <span>Logout</span> {' '}
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto flex-1 px-4 py-6">
                <Heading title={'Admin Panel'} description={'Manage products and orders'}/>

                <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                    <aside className="lg:w-48">
                        <nav className="flex flex-col space-y-1 space-x-0">
                            {sidebarNavItems.map((item) => (
                                <Button
                                    key={item.href}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start', {
                                        'bg-muted': currentPath === item.href,
                                    })}
                                >
                                    <Link to={item.href} prefetch="render">
                                        {item.title}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="my-6 md:hidden" />

                    <div className="lg:flex-1">
                        <section className="max-w-4xl space-y-12"> {children || <Outlet />} </section>
                    </div>
                </div>
            </div>
        </div>
    );
}