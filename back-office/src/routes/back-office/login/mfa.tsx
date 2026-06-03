import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ShieldCheck, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";

const mfaSearchSchema = z.object({
  tempToken: z.string(),
});

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const Route = createFileRoute("/back-office/login/mfa")({
  validateSearch: (search) => mfaSearchSchema.parse(search),
  component: MfaPage,
});

function MfaPage() {
  const { tempToken } = Route.useSearch();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setError(null);
    setLoading(true);

    const endpoint = isRecoveryMode
      ? API_ENDPOINTS.BACK_OFFICE.AUTH.RECOVERY_CODE
      : API_ENDPOINTS.BACK_OFFICE.AUTH.VERIFY_MFA;

    try {
      const res = await backOfficeFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xác thực không thành công");
      }

      // Invalidate 'me' query to fetch user status and trigger redirect
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      // Redirect to main back-office dashboard
      navigate({ to: "/" });
    } catch (err) {
      setError(getErrorMessage(err, "Xác thực không thành công"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Brand Identity */}
      <div className="text-center mb-8">
        <h1 className="text-display text-4xl tracking-[0.1em] font-light text-gold uppercase">
          Ray Paradis
        </h1>
        <div className="luxury-divider w-24 mx-auto my-3" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Bảo Mật Hai Lớp (MFA)
        </p>
      </div>

      {/* Main card */}
      <div className="bg-surface border border-border/80 rounded-xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

        <div className="mb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
            {isRecoveryMode ? (
              <KeyRound className="h-6 w-6 text-gold" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-gold" />
            )}
          </div>
          <h2 className="text-display text-lg font-medium text-foreground">
            {isRecoveryMode ? "Mã Khôi Phục Bảo Mật" : "Nhập Mã Xác Thực TOTP"}
          </h2>
          <p className="text-[11.5px] text-muted-foreground mt-1">
            {isRecoveryMode
              ? "Sử dụng một trong các mã khôi phục dự phòng 8 ký tự của bạn."
              : "Vui lòng mở ứng dụng Authenticator để lấy mã xác thực 6 số."}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] p-3 rounded-md mb-5 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <input
              type="text"
              required
              disabled={loading}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={
                isRecoveryMode ? "Nhập mã khôi phục (e.g. f3a8c2b1)" : "Nhập 6 chữ số (e.g. 123456)"
              }
              maxLength={isRecoveryMode ? 16 : 6}
              className="w-full text-center bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-3 text-[16px] font-mono tracking-[0.2em] text-foreground outline-none transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gold hover:bg-gold/90 text-gold-foreground rounded py-2.5 px-4 text-[12.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Xác nhận danh tính"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRecoveryMode(!isRecoveryMode);
              setCode("");
              setError(null);
            }}
            disabled={loading}
            className="text-[11px] text-gold hover:text-gold/80 hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            {isRecoveryMode
              ? "Sử dụng ứng dụng Authenticator thông thường"
              : "Không thể truy cập Authenticator? Sử dụng mã khôi phục"}
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-[10px] text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} Ray Paradis. Bảo mật thiết kế bởi Maison.
        </p>
      </div>
    </div>
  );
}
