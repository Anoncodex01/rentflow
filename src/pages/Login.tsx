import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await login(data.email, data.password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,25%,12%)] via-[hsl(173,58%,25%)] to-[hsl(215,25%,8%)]">
          {/* Geometric patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 border border-white/20 rounded-full" />
            <div className="absolute top-40 left-40 w-96 h-96 border border-white/10 rounded-full" />
            <div className="absolute bottom-20 right-20 w-64 h-64 border border-white/15 rounded-full" />
            <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/5 rounded-2xl rotate-45" />
            <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-white/5 rounded-xl rotate-12" />
          </div>
          
          {/* Glow effects */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="font-display text-2xl font-bold">RentFlow</span>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-bold leading-tight">
                Property Management
                <br />
                <span className="text-primary/80">Made Simple</span>
              </h1>
              <p className="text-lg text-white/70 max-w-md">
                Streamline your rental business with powerful tools for managing rooms, tenants, and payments all in one place.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Room Management', value: '✓' },
                { label: 'Tenant Tracking', value: '✓' },
                { label: 'Payment Records', value: '✓' },
                { label: 'Alerts & Reports', value: '✓' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/40">
            © 2024 RentFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">RentFlow</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="font-display text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer text */}
          <p className="text-center text-sm text-muted-foreground">
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
