import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    protected?: boolean;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string | null; // Optional now
    created_at?: string; 
    updated_at?: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface SharedData {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            avatar?: string;
            email_verified_at?: string | null;
            created_at: string;
            updated_at: string;
        };
    };
}
