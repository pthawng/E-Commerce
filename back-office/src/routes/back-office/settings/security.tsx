import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, Panel, Badge } from "@/components/ui-kit";
import { ActionDialog, FormShell, ResourceTable } from "@/components/patterns";
import { backOfficeFetch } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";
import { ShieldCheck, KeyRound, Monitor, Power, Clock, CheckCircle2 } from "lucide-react";
import {
  systemSettingsApi,
  type SystemSettingRegistryItem,
  type SystemSettingValue,
} from "@/features/settings/api/systemSettings.api";

export const Route = createFileRoute("/back-office/settings/security")({
  component: SecuritySettingsPage,
});

type BackOfficeSession = {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

type BackOfficeUser = {
  email?: string;
  fullName?: string | null;
  roles?: string[];
  staffProfile?: {
    mfaEnabled?: boolean;
    department?: string | null;
  } | null;
};

function SecuritySettingsPage() {
  const queryClient = useQueryClient();
  const [sessionToRevoke, setSessionToRevoke] = useState<BackOfficeSession | null>(null);
  const [settingsFormError, setSettingsFormError] = useState<string | null>(null);

  // Fetch active sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery<BackOfficeSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.SESSIONS.BASE);
      if (!res.ok) throw new Error("Không thể tải danh sách phiên làm việc.");
      const responseData = await res.json();
      return responseData.data;
    },
  });

  // Fetch user info from root cache (me)
  const { data: me } = useQuery<BackOfficeUser>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.ME);
      if (!res.ok) throw new Error("Không thể tải thông tin cá nhân.");
      const responseData = await res.json();
      return responseData.data;
    },
  });

  const {
    data: settingsRegistry,
    isLoading: registryLoading,
    error: registryError,
    refetch: refetchRegistry,
  } = useQuery({
    queryKey: ["system-settings", "registry"],
    queryFn: systemSettingsApi.registry,
  });

  const {
    data: systemSettings,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["system-settings", "values"],
    queryFn: systemSettingsApi.all,
  });

  // Mutation to revoke a session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.SESSIONS.BY_ID(sessionId), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không thể thu hồi phiên làm việc.");
      return res.json();
    },
    onSuccess: () => {
      setSessionToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: systemSettingsApi.update,
    onSuccess: () => {
      setSettingsFormError(null);
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });

  return (
    <Page>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-gold" /> Cấu hình Bảo mật
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Quản lý các phiên làm việc và cấu hình xác thực hai lớp (MFA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {me?.staffProfile?.mfaEnabled ? (
            <Badge variant="gold">
              <ShieldCheck className="h-3 w-3 mr-1" /> MFA đang hoạt động
            </Badge>
          ) : (
            <Badge variant="destructive">MFA chưa kích hoạt</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Panel title="Thông tin Tài khoản" subtitle="Identity profile">
            <div className="space-y-4 text-[13px]">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Nhân viên
                </label>
                <div className="font-semibold text-foreground mt-0.5">
                  {me?.fullName || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Email công việc
                </label>
                <div className="font-mono text-gold mt-0.5">{me?.email}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Phòng ban
                </label>
                <div className="text-foreground mt-0.5">
                  {me?.staffProfile?.department || "General"}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Vai trò (Roles)
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {me?.roles?.map((role: string) => (
                    <span
                      key={role}
                      className="bg-accent/80 border border-border text-foreground px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Xác thực Hai lớp (MFA)" subtitle="Multi-Factor Auth">
            <div className="space-y-4 text-[13px]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">TOTP Authenticator</h3>
                  <p className="text-[11.5px] text-muted-foreground">
                    Ứng dụng tạo mã xác nhận mỗi khi đăng nhập.
                  </p>
                </div>
              </div>

              <div className="bg-background/40 border border-border/80 rounded-md p-3.5 flex items-start gap-2.5">
                <KeyRound className="h-4.5 w-4.5 text-gold shrink-0 mt-0.5" />
                <div className="text-[11.5px] leading-relaxed text-muted-foreground">
                  MFA là bắt buộc đối với tất cả các tài khoản truy cập vào Trung tâm Vận hành. Hệ
                  thống của bạn đã được liên kết thành công.
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Sessions list */}
        <div className="md:col-span-2">
          <Panel
            title="Phiên hoạt động gần đây"
            subtitle="Thiết bị và địa điểm đang truy cập tài khoản này"
            padded={false}
          >
            <ResourceTable
              rows={sessions || []}
              getRowKey={(session) => session.id}
              isLoading={sessionsLoading}
              error={sessionsError}
              onRetry={() => void refetchSessions()}
              emptyTitle="Không có phiên đang hoạt động"
              emptyDescription="Tài khoản này hiện không có thiết bị nào khác đang truy cập."
              columns={[
                {
                  key: "device",
                  header: "Thiết bị / Trình duyệt",
                  render: (r: BackOfficeSession) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center text-muted-foreground">
                        <Monitor className="h-4 w-4 text-gold" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground text-[12.5px] truncate max-w-[240px]">
                          {r.userAgent || "Không rõ thiết bị"}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">
                          IP: {r.ipAddress}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "createdAt",
                  header: "Bắt đầu lúc",
                  render: (r: BackOfficeSession) => (
                    <div className="text-[11.5px] text-muted-foreground flex items-center gap-1.5 font-mono">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "Thao tác",
                  className: "text-right pr-4",
                  render: (r: BackOfficeSession) => (
                    <button
                      onClick={() => setSessionToRevoke(r)}
                      className="text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 p-1.5 rounded transition cursor-pointer"
                      title="Kết thúc phiên làm việc"
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  ),
                },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Panel
        title="System Settings Registry"
        subtitle="Typed settings có validation, version và audit trail ở backend"
      >
        <SystemSettingsForm
          registry={settingsRegistry ?? []}
          values={systemSettings ?? {}}
          isLoading={registryLoading || settingsLoading}
          error={registryError ?? settingsError}
          formError={settingsFormError}
          isSubmitting={updateSettingsMutation.isPending}
          mutationError={updateSettingsMutation.error}
          onRetry={() => {
            void refetchRegistry();
            void refetchSettings();
          }}
          onSubmit={(settings, reason) => {
            setSettingsFormError(null);
            if (!reason.trim()) {
              setSettingsFormError("Cần nhập lý do để ghi audit trail.");
              return;
            }
            if (Object.keys(settings).length === 0) {
              setSettingsFormError("Không có setting nào thay đổi.");
              return;
            }
            updateSettingsMutation.mutate({ settings, reason });
          }}
        />
      </Panel>

      <ActionDialog
        open={sessionToRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToRevoke(null);
        }}
        destructive
        title="Kết thúc phiên làm việc"
        description={
          sessionToRevoke
            ? `Thu hồi phiên từ ${sessionToRevoke.ipAddress ?? "unknown IP"}. Người dùng sẽ phải đăng nhập lại.`
            : ""
        }
        confirmLabel="Kết thúc phiên"
        cancelLabel="Hủy"
        isPending={revokeSessionMutation.isPending}
        error={revokeSessionMutation.error}
        onConfirm={() => {
          if (sessionToRevoke) revokeSessionMutation.mutate(sessionToRevoke.id);
        }}
      />
    </Page>
  );
}

function normalizeSettingValue(
  item: SystemSettingRegistryItem,
  value: FormDataEntryValue | null,
): SystemSettingValue {
  if (item.valueType === "boolean") return value === "true";
  if (item.valueType === "number") return Number(value);
  return String(value ?? "");
}

function settingValueToString(value: SystemSettingValue | undefined) {
  if (value === undefined) return "";
  return String(value);
}

function SystemSettingsForm({
  registry,
  values,
  isLoading,
  error,
  formError,
  mutationError,
  isSubmitting,
  onRetry,
  onSubmit,
}: {
  registry: SystemSettingRegistryItem[];
  values: Record<string, SystemSettingValue>;
  isLoading: boolean;
  error: unknown;
  formError: string | null;
  mutationError: unknown;
  isSubmitting: boolean;
  onRetry: () => void;
  onSubmit: (settings: Record<string, SystemSettingValue>, reason: string) => void;
}) {
  const grouped = registry.reduce<Record<string, SystemSettingRegistryItem[]>>((acc, item) => {
    acc[item.group] ??= [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <FormShell
      submitLabel="Lưu settings"
      isSubmitting={isSubmitting}
      error={mutationError}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextSettings: Record<string, SystemSettingValue> = {};

        for (const item of registry) {
          const nextValue = normalizeSettingValue(item, form.get(item.key));
          const currentValue = values[item.key] ?? item.defaultValue;
          if (String(nextValue) !== String(currentValue)) {
            nextSettings[item.key] = nextValue;
          }
        }

        onSubmit(nextSettings, String(form.get("reason") ?? ""));
      }}
    >
      {isLoading ? (
        <div className="text-[12px] text-muted-foreground">Đang tải settings registry...</div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
          <span>Không tải được system settings.</span>
          <button type="button" className="underline" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {Object.entries(grouped).map(([group, items]) => (
            <section key={group} className="rounded-md border border-border bg-surface/50 p-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group}
              </h3>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const currentValue = values[item.key] ?? item.defaultValue;
                  return (
                    <label key={item.key} className="block space-y-1">
                      <span className="text-[12px] font-medium">{item.key}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {item.description}
                      </span>
                      {item.valueType === "boolean" ? (
                        <select
                          name={item.key}
                          defaultValue={settingValueToString(currentValue)}
                          className="h-9 w-full rounded-md border border-border bg-background px-2 text-[12px]"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          name={item.key}
                          type={item.valueType === "number" ? "number" : "text"}
                          defaultValue={settingValueToString(currentValue)}
                          className="h-9 w-full rounded-md border border-border bg-background px-2 text-[12px]"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <label className="block space-y-1">
        <span className="text-[12px] font-medium">Audit reason</span>
        <textarea
          name="reason"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-[12px]"
          placeholder="Ví dụ: điều chỉnh payment timeout cho chiến dịch holiday traffic"
        />
      </label>
      {formError ? <p className="text-[12px] text-destructive">{formError}</p> : null}
    </FormShell>
  );
}
