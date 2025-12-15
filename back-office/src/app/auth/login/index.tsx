import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
