
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StockPilotLogo } from '@/components/stock-pilot-logo';
import { ForgotPasswordDialog } from '@/components/forgot-password-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '@/lib/firebase/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          break;
        case 'auth/invalid-credential':
            errorMessage = "Invalid credentials. Please check your email and password.";
            break;
        case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
        default:
          errorMessage = "Login failed. Please check your credentials.";
          console.error("Firebase Auth Error:", error);
          break;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPasswordClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setForgotPasswordOpen(true);
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm border-white/20 bg-card/60 shadow-2xl backdrop-blur-lg transition-transform duration-300 ease-in-out hover:scale-[1.01] hover:shadow-xl">
          <CardHeader className="text-center">
             <StockPilotLogo className="w-16 h-16" />
            <CardTitle className="text-3xl font-bold tracking-tight">
              <span className="text-foreground">Mahmud Engineering Shop</span>
            </CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="m@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center justify-between">
                         <FormLabel>Password</FormLabel>
                         <a href="#" onClick={handleForgotPasswordClick} className="text-sm text-primary hover:underline">
                           Forgot password?
                         </a>
                       </div>
                       <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            <span className="sr-only">{showPassword ? 'Hide' : 'Show'} password</span>
                          </button>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <span>Don't have an account?</span>
            <Link href="/signup" className="ml-1 text-primary hover:underline">
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </div>
      <ForgotPasswordDialog open={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </>
  );
}
