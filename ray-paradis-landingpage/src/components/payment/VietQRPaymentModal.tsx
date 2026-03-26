import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';

interface VietQRPaymentInfo {
  orderId: string;
  orderCode: string;
  amount: number;
  transferCode: string;
  qrUrl: string;
  accountNo: string;
  accountName: string;
  note: string;
  expiresAt: string;
}

interface Props {
  info: VietQRPaymentInfo;
  formatPrice: (value: number) => string;
  onClose: () => void;
}

/**
 * VietQRPaymentModal
 *
 * Displays the bank QR code with:
 *  - Dynamic QR image from vietqr.io
 *  - Copy-to-clipboard for account number and transfer code
 *  - Countdown timer (expires in N minutes)
 *  - Instruction steps
 */
export const VietQRPaymentModal: React.FC<Props> = ({ info, formatPrice, onClose }) => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(info.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });
  const [imgError, setImgError] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const copy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error('Không thể sao chép, hãy copy thủ công.');
    }
  }, []);

  const isExpired = secondsLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-background rounded-none shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-gold" />
            <span className="font-medium tracking-widest text-sm uppercase text-foreground">
              Thanh Toán Chuyển Khoản
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Countdown + Amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Số tiền</p>
              <p className="text-2xl font-serif text-foreground">{formatPrice(info.amount)}</p>
            </div>
            <div className={`text-right ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {isExpired ? 'Hết hạn' : 'Còn lại'}
              </p>
              <p className={`text-2xl font-mono font-semibold ${isExpired ? 'text-destructive' : ''}`}>
                {isExpired ? '00:00' : formatTime(secondsLeft)}
              </p>
            </div>
          </div>

          {/* QR Code */}
          {!isExpired && (
            <div className="flex justify-center">
              {!imgError ? (
                <img
                  src={info.qrUrl}
                  alt={`QR chuyển khoản ${info.orderCode}`}
                  className="w-52 h-52 object-contain border border-border"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center border border-border text-muted-foreground bg-muted text-center p-4 text-sm">
                  <QrCode className="h-8 w-8 mb-2" />
                  Mở app ngân hàng và quét QR hoặc chuyển khoản theo thông tin bên dưới
                </div>
              )}
            </div>
          )}

          {isExpired && (
            <div className="bg-destructive/10 text-destructive text-sm text-center py-3 px-4 rounded-none">
              Phiên thanh toán đã hết hạn. Vui lòng tạo đơn mới.
            </div>
          )}

          {/* Bank Details */}
          <div className="space-y-3">
            <BankRow label="Ngân hàng" value="MB Bank (970422)" />
            <BankRow
              label="Số tài khoản"
              value={info.accountNo}
              onCopy={() => copy(info.accountNo, 'số tài khoản')}
            />
            <BankRow label="Tên tài khoản" value={info.accountName} />
            <BankRow
              label="Nội dung CK"
              value={info.transferCode}
              highlight
              onCopy={() => copy(info.transferCode, 'nội dung chuyển khoản')}
            />
          </div>

          {/* Instruction */}
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Mở app ngân hàng → Quét QR hoặc nhập STK thủ công</li>
            <li>Nhập đúng số tiền và nội dung chuyển khoản</li>
            <li>Đơn hàng sẽ tự động xác nhận sau khi nhận tiền</li>
          </ol>

          {/* CTA */}
          <button
            onClick={() => navigate(`/payment-result?orderId=${info.orderId}&provider=VIETQR`)}
            disabled={isExpired}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-3 text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Tôi đã chuyển khoản → Kiểm tra trạng thái
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Helper ────────────────────────────────────────────────────────────────────
const BankRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
}> = ({ label, value, highlight, onCopy }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`text-sm font-medium truncate ${
          highlight ? 'text-gold font-semibold tracking-wider' : 'text-foreground'
        }`}
      >
        {value}
      </span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Sao chép"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);
