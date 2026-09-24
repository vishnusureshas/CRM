import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '../../api/authApi.ts';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice.ts';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/input.tsx';
import { Loader2, Sparkles, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Password required') });

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data: any) => {
    setServerError('');
    try {
      const res: any = await login(data).unwrap();
      dispatch(setCredentials({ accessToken: res.data.accessToken, user: res.data.user, organization: res.data.organization }));
      navigate('/dashboard');
    } catch (e: any) {
      setServerError(e?.data?.message || 'Login failed — check credentials');
    }
  };

  return (
    <Card className="card-premium overflow-hidden border-slate-200/70">
      <div className="h-[3px] w-full gradient-primary" />
      <CardHeader className="space-y-4 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-sm"><Sparkles className="w-4 h-4" /></div>
            <div className="leading-tight">
              <div className="text-[11px] tracking-[0.14em] font-semibold text-primary uppercase">PulseCRM</div>
              <div className="text-xs text-muted-foreground">Enterprise workspace</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live</span>
        </div>
        <div>
          <CardTitle className="text-[22px] tracking-tight font-semibold">Welcome back</CardTitle>
          <CardDescription className="mt-1.5 text-slate-500">Sign in to your workspace — secure, org-isolated.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-wide font-medium text-slate-700 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> Email</Label>
            <Input placeholder="you@company.com" className="h-11 bg-white border-slate-200 focus:border-primary/40 focus:ring-4 focus:ring-primary/10" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{(errors.email as any).message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label className="text-xs tracking-wide font-medium text-slate-700 flex items-center gap-1.5"><KeyRound className="w-3 h-3 text-slate-400" /> Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium">Forgot?</Link></div>
            <Input type="password" placeholder="••••••••" className="h-11 bg-white border-slate-200 focus:border-primary/40 focus:ring-4 focus:ring-primary/10" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{(errors.password as any).message}</p>}
          </div>
          {serverError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{serverError}</div>}
          <Button type="submit" className="w-full h-11 rounded-xl gradient-primary text-white font-medium shadow-sm hover:opacity-[0.95] transition-opacity" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>}
          </Button>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <Link to="/register" className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-sm">Create new workspace</Link>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground border border-slate-200 rounded-full px-3 py-1.5 bg-slate-50 w-fit mx-auto"><Lock className="w-3 h-3 text-primary" /> Demo: <span className="font-medium text-slate-700 mono">admin@crm.local / Password@123</span></div>
        </form>
      </CardContent>
    </Card>
  );
};
