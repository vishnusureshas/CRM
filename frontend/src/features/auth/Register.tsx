import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '../../api/authApi.ts';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice.ts';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/input.tsx';
import { Loader2, Sparkles, Building2, Mail, KeyRound } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars'),
  confirmPassword: z.string(),
  organizationName: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [registerApi, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [err, setErr] = useState('');

  const onSubmit = async (data: any) => {
    setErr('');
    try {
      const res: any = await registerApi({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password, confirmPassword: data.confirmPassword, organizationName: data.organizationName }).unwrap();
      dispatch(setCredentials({ accessToken: res.data.accessToken, user: res.data.user, organization: res.data.organization }));
      navigate('/dashboard');
    } catch (e: any) { setErr(e?.data?.message || 'Registration failed'); }
  };

  return (
    <Card className="card-premium overflow-hidden border-slate-200/70">
      <div className="h-[3px] w-full gradient-primary" />
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-sm"><Sparkles className="w-4 h-4" /></div>
          <div className="leading-tight">
            <div className="text-[11px] tracking-[0.14em] font-semibold text-primary uppercase">PulseCRM</div>
            <div className="text-xs text-muted-foreground">Create workspace</div>
          </div>
        </div>
        <CardTitle className="text-[22px] tracking-tight font-semibold mt-4">Get started</CardTitle>
        <CardDescription className="text-slate-500">Workspace + pipeline + 6 stages in one transaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700">First name</Label><Input {...register('firstName')} placeholder="Ada" className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" />{errors.firstName && <p className="text-xs text-red-600">{(errors.firstName as any).message}</p>}</div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700">Last name</Label><Input {...register('lastName')} placeholder="Lovelace" className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" />{errors.lastName && <p className="text-xs text-red-600">{(errors.lastName as any).message}</p>}</div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> Email</Label><Input {...register('email')} placeholder="ada@company.com" className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" />{errors.email && <p className="text-xs text-red-600">{(errors.email as any).message}</p>}</div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Building2 className="w-3 h-3 text-slate-400" /> Workspace <span className="font-normal text-muted-foreground">— optional</span></Label><Input {...register('organizationName')} placeholder="Acme Inc" className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><KeyRound className="w-3 h-3 text-slate-400" /> Password</Label><Input type="password" {...register('password')} className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" />{errors.password && <p className="text-xs text-red-600">{(errors.password as any).message}</p>}</div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-700">Confirm</Label><Input type="password" {...register('confirmPassword')} className="h-10 bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 border-slate-200" />{errors.confirmPassword && <p className="text-xs text-red-600">{(errors.confirmPassword as any).message}</p>}</div>
          </div>
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{err}</div>}
          <Button type="submit" className="w-full h-11 rounded-xl gradient-primary text-white font-medium shadow-sm hover:opacity-[0.95] transition-opacity" disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create workspace →'}</Button>
          <p className="text-sm text-center text-muted-foreground">Have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
        </form>
      </CardContent>
    </Card>
  );
};
