import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, KeyRound, Mail, ArrowRight } from "lucide-react";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS, BackOfficeAuthNextStep } from "@shared";

export const Route = createFileRoute("/back-office/login/")({
  component: LoginPage,
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đăng nhập thất bại";
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Đăng nhập thất bại");
      }

      const { nextStep, tempToken } = responseData.data || {};
      if (nextStep === BackOfficeAuthNextStep.MFA_REQUIRED) {
        navigate({
          to: "/back-office/login/mfa",
          search: { tempToken },
        });
      } else if (nextStep === BackOfficeAuthNextStep.MFA_SETUP_REQUIRED) {
        navigate({
          to: "/back-office/setup-mfa",
          search: { tempToken },
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-display text-4xl tracking-[0.1em] font-light text-gold uppercase animate-fade-in">
          Ray Paradis
        </h1>
        <div className="luxury-divider w-24 mx-auto my-3" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Trung tâm Vận hành
        </p>
      </div>

      <div className="bg-surface border border-border/80 rounded-xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

        <div className="mb-6">
          <h2 className="text-display text-lg font-medium text-foreground">Đăng nhập</h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Dành riêng cho nhân viên và ban điều hành thương hiệu.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] p-3 rounded-md mb-5 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">
              Địa chỉ email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@rayparadis.com"
                className="w-full bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-2 pl-10 text-[13px] text-foreground placeholder:text-muted-foreground outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-2 pl-10 text-[13px] text-foreground placeholder:text-muted-foreground outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gold hover:bg-gold/90 text-gold-foreground rounded py-2 px-4 text-[12.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg hover:shadow-gold/10"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold-foreground border-t-transparent" />
            ) : (
              <>
                Tiếp tục <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center mt-6">
        <p className="text-[10px] text-muted-foreground tracking-wide">
          (c) {new Date().getFullYear()} Ray Paradis. Bảo mật bằng MFA.
        </p>
      </div>
    </div>
  );
}
