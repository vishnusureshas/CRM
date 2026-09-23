import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '../../api/authApi.ts';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice.ts';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/input.tsx';
import { Loader2, ShieldCheck } from 'lucide-react';
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
    <Card className="card-premium overflow-hidden animate-in">
      <div className="h-[3px] w-full bg-slate-900" />
      <CardHeader className="pb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white"><ShieldCheck className="w-4 h-4" /></div>
        <CardTitle className="text-[22px] tracking-tight mt-3">Create workspace</CardTitle>
        <CardDescription>Org + pipeline + 6 stages created in one PostgreSQL transaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">First name</Label><Input {...register('firstName')} placeholder="Ada" className="h-10 bg-slate-50 focus:bg-white border-slate-200" />{errors.firstName && <p className="text-xs text-red-600">{(errors.firstName as any).message}</p>}</div>
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">Last name</Label><Input {...register('lastName')} placeholder="Lovelace" className="h-10 bg-slate-50 focus:bg-white border-slate-200" />{errors.lastName && <p className="text-xs text-red-600">{(errors.lastName as any).message}</p>}</div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">Email</Label><Input {...register('email')} placeholder="ada@crm.local" className="h-10 bg-slate-50 focus:bg-white border-slate-200" />{errors.email && <p className="text-xs text-red-600">{(errors.email as any).message}</p>}</div>
          <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">Workspace <span className="normal-case font-normal text-muted-foreground">— optional</span></Label><Input {...register('organizationName')} placeholder="Acme Inc" className="h-10 bg-slate-50 focus:bg-white border-slate-200" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">Password</Label><Input type="password" {...register('password')} className="h-10 bg-slate-50 focus:bg-white border-slate-200" />{errors.password && <p className="text-xs text-red-600">{(errors.password as any).message}</p>}</div>
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide">Confirm</Label><Input type="password" {...register('confirmPassword')} className="h-10 bg-slate-50 focus:bg-white border-slate-200" />{errors.confirmPassword && <p className="text-xs text-red-600">{(errors.confirmPassword as any).message}</p>}</div>
          </div>
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{err}</div>}
          <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-900/90 font-medium" disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create workspace →'}</Button>
          <p className="text-sm text-center text-muted-foreground">Have an account? <Link to="/login" className="text-slate-900 font-medium hover:underline">Sign in</Link></p>
        </form>
      </CardContent>
    </Card>
  );
};
