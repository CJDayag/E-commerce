import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner'; // Add import for toast
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useAuth } from '@/context/AuthContext';

type LoginForm = {
  email: string;
  password: string;
  remember: boolean;
};

interface LoginProps {
  status?: string;
  canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
  usePageTitle('Login');
  const navigate = useNavigate();
  // Get both login and fetchUser from useAuth
  const { login, fetchUser } = useAuth();
  const [error, setError] = useState<string>('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (formData: LoginForm) => {
    try {
      setError('');

      // Use the login function from AuthContext instead of authService
      await login(formData.email, formData.password);

      // The tokens are already saved in localStorage by the login function
      // so no need to set them again

      // Fetch user profile and use the returned data
      const userData = await fetchUser();

      // Use the returned userData directly for navigation
      if (userData?.is_staff || userData?.is_superuser) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }

      // Show success toast
      toast.success('Login successful! Welcome back.');

    } catch (error: any) {
      const errorMessage = error.response?.data?.non_field_errors?.[0] || 'Login failed';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        description: 'Please check your credentials and try again.',
        duration: 5000,
      });
      
      reset({ password: '' });
    }
  };


  return (
    <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              tabIndex={1}
              autoComplete="email"
              placeholder="email@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            <InputError message={errors.email?.message} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              {canResetPassword && (
                <TextLink to="/forgot-password" className="ml-auto text-sm" tabIndex={5}>
                  Forgot password?
                </TextLink>
              )}
            </div>
            <Input
              id="password"
              type="password"
              required
              tabIndex={2}
              autoComplete="current-password"
              placeholder="Password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            <InputError message={errors.password?.message} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox id="remember" {...register('remember')} tabIndex={3} />
            <Label htmlFor="remember">Remember me</Label>
          </div>

          {error && <div className="text-red-600 text-sm font-medium text-center">{error}</div>}

          <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </div>

        <div className="text-muted-foreground text-center text-sm">
          Don't have an account?{' '}
          <TextLink to="/register" tabIndex={5}>
            Sign up
          </TextLink>
        </div>
      </form>

      {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
    </AuthLayout>
  );
}
