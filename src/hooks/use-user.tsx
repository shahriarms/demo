
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useToast } from './use-toast';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import app from '@/lib/firebase/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'employee';

interface User {
  uid: string;
  email: string | null;
  role: Role;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  generateAdminCode: () => void;
  redeemAdminCode: (code: string) => boolean;
  adminCode: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const ADMIN_EMAIL = "shahriar.ms1k@gmail.com";
const ADMIN_CODE_STORAGE_KEY = 'stockpilot-admin-code';

export function UserProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminCode, setAdminCode] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email === ADMIN_EMAIL;
        let userRole: Role = isUserAdmin ? 'admin' : 'employee';

        // Check session storage for a role override
        const sessionRole = sessionStorage.getItem('user-role') as Role;
        if (sessionRole) {
            userRole = sessionRole;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: userRole,
        });
        
        if (isUserAdmin) {
            const storedCode = localStorage.getItem(ADMIN_CODE_STORAGE_KEY);
            if(storedCode) {
                setAdminCode(storedCode);
            }
        }
         // If user is on login/signup page, redirect to dashboard
        if (pathname === '/login' || pathname === '/signup') {
            router.push('/dashboard');
        }

      } else {
        setUser(null);
        sessionStorage.removeItem('user-role');
        if (pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, pathname, router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await auth.signOut();
    setUser(null);
    setAdminCode(null); 
    sessionStorage.removeItem('user-role');
    router.push('/login');
    setIsLoading(false);
  }, [auth, router]);

  const generateAdminCode = useCallback(() => {
    if (user?.email === ADMIN_EMAIL) {
      const newCode = `ADMIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      localStorage.setItem(ADMIN_CODE_STORAGE_KEY, newCode);
      setAdminCode(newCode);
       toast({
        title: 'Admin Code Generated',
        description: 'You can now share this persistent code with an employee.',
      });
    }
  }, [user, toast]);

  const redeemAdminCode = useCallback((code: string) => {
    const storedCode = localStorage.getItem(ADMIN_CODE_STORAGE_KEY);
    
    if (!code || code !== storedCode) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'The code you entered is incorrect or has expired.',
      });
      return false;
    }

    if (user && code === storedCode) {
      const updatedUser = { ...user, role: 'admin' as Role };
      setUser(updatedUser);
      sessionStorage.setItem('user-role', 'admin');
      
      localStorage.removeItem(ADMIN_CODE_STORAGE_KEY); // Invalidate the code after use
      setAdminCode(null);

      toast({
        title: 'Success!',
        description: 'You now have admin privileges for this session.',
      });
      return true;
    }
    
    return false;
  }, [user, toast]);
  

  const value = useMemo(() => ({ user, isLoading, logout, generateAdminCode, redeemAdminCode, adminCode }), [user, isLoading, logout, generateAdminCode, redeemAdminCode, adminCode]);

  // If loading and not on an auth page, show a global loader.
  // This prevents content flashing on initial load or after logout.
  if (isLoading && pathname !== '/login' && pathname !== '/signup') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // On auth pages, we want to show the page content while checking auth state in background
  if (isLoading && (pathname === '/login' || pathname === '/signup')) {
     return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
  }

  // Prevent dashboard rendering for unauthenticated users, even for a flash
  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }


  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
