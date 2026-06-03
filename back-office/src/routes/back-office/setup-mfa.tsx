import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ShieldCheck, Copy, Download, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";

const setupMfaSearchSchema = z.object({
  tempToken: z.string(),
});

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const Route = createFileRoute("/back-office/setup-mfa")({
  validateSearch: (search) => setupMfaSearchSchema.parse(search),
  component: SetupMfaPage,
});

function SetupMfaPage() {
  const { tempToken } = Route.useSearch();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchSetupDetails = async () => {
      try {
        const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.MFA_SETUP, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempToken }),
        });
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.message || "Không thể khởi tạo MFA.");
        }
        setQrCodeUrl(responseData.data?.qrCodeUrl);
        setSecret(responseData.data?.secret);
      } catch (err) {
        setError(getErrorMessage(err, "Không thể khởi tạo MFA."));
      }
    };
    fetchSetupDetails();
  }, [tempToken]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setError(null);
    setLoading(true);

    try {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.MFA_VERIFY_SETUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Mã xác thực không chính xác.");
      }

      setRecoveryCodes(responseData.data?.recoveryCodes);
    } catch (err) {
      setError(getErrorMessage(err, "Mã xác thực không chính xác."));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (!recoveryCodes) return;
    const text = recoveryCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!recoveryCodes) return;
    const text = `RAY PARADIS - MAISON BACK-OFFICE RECOVERY CODES\nDate: ${new Date().toLocaleDateString()}\n\nKeep these codes secure. Each code can only be used once.\n\n${recoveryCodes.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rayparadis-recovery-codes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = async () => {
    // Invalidate 'me' query to update user info to authenticated
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    navigate({ to: "/" });
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Brand Identity */}
      <div className="text-center mb-8">
        <h1 className="text-display text-4xl tracking-[0.1em] font-light text-gold uppercase">
          Ray Paradis
        </h1>
        <div className="luxury-divider w-24 mx-auto my-3" />
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Thiết Lập Bảo Mật
        </p>
      </div>

      {/* Main card */}
      <div className="bg-surface border border-border/80 rounded-xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

        {error && !recoveryCodes && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] p-3 rounded-md mb-5 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!recoveryCodes ? (
          <div>
            <div className="mb-6">
              <h2 className="text-display text-lg font-medium text-foreground">
                Kích hoạt Xác thực Hai yếu tố
              </h2>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Bảo vệ tài khoản quản trị của bạn với mã xác thực TOTP.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 bg-background/50 border border-border/60 rounded-lg p-5">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="MFA QR Code"
                    className="h-44 w-44 rounded border border-border/85 bg-white p-1"
                  />
                ) : (
                  <div className="h-44 w-44 rounded border border-border bg-muted flex items-center justify-center animate-pulse">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[11.5px] text-muted-foreground">
                    Quét mã QR bằng ứng dụng Authenticator (Google Authenticator, Microsoft
                    Authenticator, v.v.)
                  </p>
                  {secret && (
                    <div className="mt-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Khóa dự phòng
                      </p>
                      <code className="text-gold font-mono text-[12px] select-all bg-surface/50 px-2 py-0.5 rounded border border-border mt-0.5 inline-block">
                        {secret}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">
                    Nhập mã xác thực từ thiết bị để xác minh
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Mã 6 chữ số (e.g. 123456)"
                    maxLength={6}
                    className="w-full text-center bg-background border border-border hover:border-border-strong focus:border-gold rounded px-3 py-2 text-[15px] font-mono tracking-[0.1em] text-foreground outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !secret}
                  className="w-full mt-4 bg-gold hover:bg-gold/90 text-gold-foreground rounded py-2 px-4 text-[12.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {loading ? (
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-gold-foreground border-t-transparent" />
                  ) : (
                    "Xác nhận & Kích hoạt"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h2 className="text-display text-lg font-medium text-foreground">
                Kích hoạt thành công
              </h2>
              <p className="text-[11.5px] text-muted-foreground mt-1">
                Ứng dụng Authenticator của bạn đã được kết nối.
              </p>
            </div>

            <div className="space-y-5 bg-background/50 border border-border/60 rounded-lg p-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[12px] font-semibold text-warning">LƯU TRỮ MÃ KHÔI PHỤC</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Bạn phải lưu trữ các mã bảo mật này ở nơi an toàn. Mỗi mã chỉ dùng để đăng nhập
                    1 lần nếu bạn làm mất điện thoại. Chúng tôi sẽ không hiển thị lại các mã này.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono text-[12px] text-foreground py-2 border-y border-border/80">
                {recoveryCodes.map((code) => (
                  <div
                    key={code}
                    className="bg-surface/50 border border-border/40 py-1.5 rounded select-all font-semibold tracking-wider text-gold"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCodes}
                  className="flex-1 border border-border hover:border-border-strong hover:bg-accent/40 rounded py-2 text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedCodes ? "Đã sao chép" : "Sao chép mã"}
                </button>
                <button
                  onClick={handleDownloadCodes}
                  className="flex-1 border border-border hover:border-border-strong hover:bg-accent/40 rounded py-2 text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Tải file xuống
                </button>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full mt-6 bg-gold hover:bg-gold/90 text-gold-foreground rounded py-2.5 px-4 text-[12.5px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              Vào Trang Vận Hành
            </button>
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
