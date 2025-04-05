import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useAuth } from '@/context/AuthContext';
import { type User } from '@/types';
import { LogOut, CircleUserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface UserMenuContentProps {
    user: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar'>;
    showEmail?: boolean;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const navigate = useNavigate();
    const auth = useAuth(); // Add this line to access the auth context

    const handleLogout = async () => {
        try {
            // Use the logout function from AuthContext instead of making a direct API call
            if (auth) {
                await auth.logout();
                navigate('/login');
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
        cleanup();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" to="/profile/" onClick={cleanup}>
                        <CircleUserRound className="mr-2" />
                        Profile
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button className="block w-full text-left" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    Log out
                </button>
            </DropdownMenuItem>
        </>
    );
}