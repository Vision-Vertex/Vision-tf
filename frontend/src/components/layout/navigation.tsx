'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Settings, 
  Activity, 
  AlertTriangle, 
  LogOut,
  Users,
  FileText,
  BarChart3,
  Cog,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('CLIENT' | 'DEVELOPER' | 'ADMIN')[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Activity,
    roles: ['CLIENT', 'DEVELOPER', 'ADMIN']
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['CLIENT', 'DEVELOPER', 'ADMIN']
  },
  {
    label: 'Sessions',
    href: '/sessions',
    icon: Shield,
    roles: ['CLIENT', 'DEVELOPER', 'ADMIN']
  },
  {
    label: '2FA Settings',
    href: '/2fa',
    icon: Settings,
    roles: ['CLIENT', 'DEVELOPER', 'ADMIN']
  },
  // Admin-only items
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit',
    icon: FileText,
    roles: ['ADMIN']
  },
  {
    label: 'Security',
    href: '/admin/security',
    icon: AlertTriangle,
    roles: ['ADMIN']
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['ADMIN']
  },
  {
    label: 'System Settings',
    href: '/admin/settings',
    icon: Cog,
    roles: ['ADMIN']
  }
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, handleLogout } = useAuthStore();

  const userRole = user?.role || 'CLIENT';
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole as 'CLIENT' | 'DEVELOPER' | 'ADMIN')
  );

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Vision TF</h1>
            <Badge variant={userRole === 'ADMIN' ? 'default' : 'secondary'}>
              {userRole}
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <span className="hidden md:block text-sm text-gray-600">
              Welcome, {user?.firstname} {user?.lastname}
            </span>
            
            <Button 
              onClick={handleLogoutClick} 
              variant="outline" 
              size="sm"
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              <div className="pt-2 border-t">
                <div className="px-3 py-2 text-sm text-gray-600">
                  Welcome, {user?.firstname} {user?.lastname}
                </div>
                <Button 
                  onClick={handleLogoutClick} 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
