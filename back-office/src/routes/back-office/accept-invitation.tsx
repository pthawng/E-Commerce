import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ShieldCheck, Lock, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS, BackOfficeAuthNextStep } from "@shared";

const acceptInvitationSearchSchema = z.object({
  token: z.string(),
});

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const Route = createFileRoute("/back-office/accept-invitation")({
  validateSearch: (search) => acceptInvitationSearchSchema.parse(search),
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await backOfficeFetch(
          `${API_ENDPOINTS.BACK_OFFICE.STAFF.INVITATION_VERIFY}?token=${encodeURIComponent(token)}`,
        );
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.message || "Mã kích hoạt không hợp lệ hoặc đã hết hạn.");
        }

        setInvitationEmail(responseData.data?.email);
      } catch (err) {
        setError(getErrorMessage(err, "Mã kích hoạt không hợp lệ hoặc đã hết hạn."));
      } finally {
        setVerifyingToken(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password.length < 8) {
      setError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.STAFF.INVITATION_ACCEPT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Chấp nhận lời mời thất bại.");
      }

      const { nextStep, tempToken } = responseData.data || {};
      if (nextStep === BackOfficeAuthNextStep.MFA_SETUP_REQUIRED) {
        navigate({
          to: "/back-office/setup-mfa",
          search: { tempToken },
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Chấp nhận lời mời thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Brand Identity */}
      <div className="text-center mb-8">
        <h1 className="text-display text-4xl tracking-[0.1em] font-light text-gold uppercase">
          Ray Paradis
        </h1>
        <div className="luxury-divider w-24 mx-auto my-3" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Kích Hoạt Tài Khoản Quản Trị
        </p>
      </div>

      {/* Main card */}
      <div className="bg-surface border border-border/80 rounded-xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

        {verifyingToken ? (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <RefreshCw className="h-8 w-8 text-gold animate-spin" />
            <p className="text-[12px] text-muted-foreground uppercase tracking-wider animate-pulse">
              Đang xác thực mã kích hoạt...
            </p>
          </div>
        ) : error && !invitationEmail ? (
          <div className="py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-display text-lg font-medium text-foreground">Không thể tiếp tục</h2>
            <p className="text-[12.5px] text-muted-foreground mt-2 leading-relaxed">{error}</p>
            <p className="text-[11.5px] text-muted-foreground/60 mt-4 leading-relaxed">
              Vui lòng yêu cầu Quản trị viên hệ thống gửi lại email lời mời mới.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-display text-lg font-medium text-foreground">
                Chào mừng đến với Maison
              </h2>
              <p className="text-[11.5px] text-muted-foreground mt-1">
                Tài khoản staff liên kết với email{" "}
                <span className="text-gold font-semibold select-all">{invitationEmail}</span> đã sẵn
                sàng để kích hoạt.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] p-3 rounded-md mb-5 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAccept} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">
                  Thiết lập Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-2 pl-10 pr-10 text-[13px] text-foreground outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">
                  Xác nhận Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-2 pl-10 text-[13px] text-foreground outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gold hover:bg-gold/90 text-gold-foreground rounded py-2 px-4 text-[12.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  "Tiến hành thiết lập MFA"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="text-center mt-6">
        <p className="text-[10px] text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} Ray Paradis. Bảo mật tuyệt đối bởi hệ thống MFA.
        </p>
      </div>
    </div>
  );
}
