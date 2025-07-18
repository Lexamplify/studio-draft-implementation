'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuthToken();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [token, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return token ? <>{children}</> : null;
}
