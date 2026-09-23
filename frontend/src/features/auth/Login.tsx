import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '../../api/authApi.ts';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice.ts';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/input.tsx';
import { Loader2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
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
    <Card className="card-premium overflow-hidden animate-in">
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #334155 100%)' }} />
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white"><ShieldCheck className="w-4 h-4" /></div>
          <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure</span>
        </div>
        <div>
          <CardTitle className="text-[22px] tracking-tight">Sign in</CardTitle>
          <CardDescription className="mt-1">Welcome back — enter your workspace credentials.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs tracking-wide uppercase">Email</Label>
            <Input placeholder="admin@crm.local" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{(errors.email as any).message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label className="text-xs tracking-wide uppercase">Password</Label><Link to="/forgot-password" className="text-xs text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">Forgot?</Link></div>
            <Input type="password" placeholder="••••••••" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{(errors.password as any).message}</p>}
          </div>
          {serverError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{serverError}</div>}
          <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-900/90 text-white font-medium" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4 ml-1.5" /></>}
          </Button>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <Link to="/register" className="flex h-11 items-center justify-center rounded-xl border bg-white hover:bg-slate-50 text-sm font-medium transition-colors">Create workspace</Link>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground border rounded-full px-3 py-1.5 bg-slate-50 w-fit mx-auto"><Lock className="w-3 h-3" /> Demo: <span className="font-medium text-foreground mono">admin@crm.local / Password@123</span></div>
        </form>
      </CardContent>
    </Card>
  );
};
