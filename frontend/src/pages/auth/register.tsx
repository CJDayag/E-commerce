import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerService } from '@/services/auth/register';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  re_password: string; // Updated to match Djoser
};

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    watch 
  } = useForm<RegisterForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      re_password: '', // Ensure the right field name
    }
  });

  const onSubmit = async (formData: RegisterForm) => {
    try {
      setError('');

      // Call the Djoser API
      await registerService.register(formData);

      reset();
      navigate('/login'); // Redirect to login page after successful registration
    } catch (error: any) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.email) errorMessage = errorData.email[0];
        if (errorData.password) errorMessage = errorData.password[0];
        if (errorData.non_field_errors) errorMessage = errorData.non_field_errors[0];
      }

      setError(errorMessage);
      reset({ password: '', re_password: '' });
    }
  };

  return (
    <AuthLayout title="Create an account" description="Enter your details below to create your account">
      <Helmet>
        <title>Register</title>
      </Helmet>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">

          {/* Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              autoFocus
              tabIndex={1}
              autoComplete="name"
              placeholder="First name"
              {...register('first_name')}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
                id="last_name"
                type="text"
                autoFocus
                tabIndex={1}
                autoComplete="name"
                placeholder="Last name"
                {...register('last_name')}
            />
          </div>

          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              tabIndex={2}
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

          {/* Password Field */}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              tabIndex={3}
              autoComplete="new-password"
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

          {/* Confirm Password Field */}
          <div className="grid gap-2">
            <Label htmlFor="re_password">Confirm password</Label>
            <Input
              id="re_password"
              type="password"
              tabIndex={4}
              autoComplete="new-password"
              placeholder="Confirm password"
              {...register('re_password', { 
                required: 'Please confirm your password',
                validate: (val: string) => {
                  if (watch('password') !== val) {
                    return 'Passwords do not match';
                  }
                },
              })}
            />
            <InputError message={errors.re_password?.message} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="mt-2 w-full" 
            tabIndex={5} 
            disabled={isSubmitting}
          >
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </div>

        <div className="text-muted-foreground text-center text-sm">
          Already have an account?{' '}
          <TextLink to="/login" tabIndex={6}>
            Log in
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}
