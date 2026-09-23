import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPasswordMutation } from '../../api/authApi.ts';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/input.tsx';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const schema = z.object({ email: z.string().email() });

export const ForgotPassword = () => {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [msg, setMsg] = useState('');
  const onSubmit = async (data: any) => {
    const res: any = await forgot(data).unwrap();
    setMsg(res.message + (res.data?.resetToken ? ` · Token: ${res.data.resetToken.slice(0,12)}…` : ''));
  };
  return (
    <Card className="shadow-soft border-0">
      <CardHeader><CardTitle>Reset password</CardTitle><CardDescription>Enter your email to receive a reset link</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Email</Label><Input {...register('email')} placeholder="you@crm.local" /></div>
          <Button type="submit" className="w-full" disabled={isLoading}>Send link</Button>
          {msg && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">{msg}</p>}
          <Link to="/login" className="text-sm text-primary hover:underline block text-center">Back to login</Link>
        </form>
      </CardContent>
    </Card>
  );
};
