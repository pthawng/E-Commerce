import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, Panel } from "@/components/ui-kit";
import { ActionDialog, ResourceTable, StatusBadge } from "@/components/patterns";
import { backOfficeFetch, backOfficeJson } from "@/lib/back-office-api";
import { API_ENDPOINTS, StaffStatus } from "@shared";
import type { StaffStatusValue } from "@shared";
import {
  Plus,
  Users,
  ShieldAlert,
  Ban,
  ShieldCheck,
  Mail,
  LogOut,
  CheckSquare,
  Edit,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/back-office/staff")({
  component: StaffAdminPage,
});

type StaffRow = {
  id: string;
  email: string;
  fullName?: string | null;
  roles: string[];
  staffProfile?: {
    department?: string | null;
    staffStatus?: StaffStatusValue | null;
    mfaEnabled?: boolean;
  } | null;
};

type CurrentStaffUser = {
  id: string;
};

type BackOfficeRole = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
};

type StaffActionDialogState =
  | { type: "status"; staff: StaffRow; nextStatus: StaffStatusValue }
  | { type: "logout"; staff: StaffRow }
  | null;

function StaffAdminPage() {
  const queryClient = useQueryClient();

  // Dialog/Form states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDept, setInviteDept] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["STAFF"]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Role Edit states
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Status/action dialog state
  const [actionDialog, setActionDialog] = useState<StaffActionDialogState>(null);

  // Fetch staff list
  const {
    data: staffList,
    isLoading: listLoading,
    error: listError,
    refetch,
  } = useQuery<StaffRow[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.STAFF.BASE);
      if (!res.ok) throw new Error("Không thể tải danh sách nhân sự.");
      const responseData = await res.json();
      return responseData.data;
    },
  });

  // Fetch current user (to prevent self-suspend/demotion check)
  const { data: me } = useQuery<CurrentStaffUser>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.AUTH.ME);
      if (!res.ok) throw new Error("Không thể tải thông tin cá nhân.");
      const responseData = await res.json();
      return responseData.data;
    },
  });

  const {
    data: availableRoles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery<BackOfficeRole[]>({
    queryKey: ["staff", "available-roles"],
    queryFn: () =>
      backOfficeJson<BackOfficeRole[]>(API_ENDPOINTS.BACK_OFFICE.STAFF.AVAILABLE_ROLES),
  });

  const roleOptions = availableRoles ?? [];

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.STAFF.INVITATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          department: inviteDept || undefined,
          roleSlugs: inviteRoles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi lời mời thất bại.");
      return data;
    },
    onSuccess: () => {
      setInviteSuccess("Đã tạo lời mời thành công! Email chứa liên kết kích hoạt đã được gửi.");
      setInviteEmail("");
      setInviteDept("");
      setInviteRoles(["STAFF"]);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setTimeout(() => {
        setInviteSuccess(null);
        setShowInviteModal(false);
      }, 3000);
    },
    onError: (err: unknown) => {
      setInviteError(err instanceof Error ? err.message : "Gá»­i lá»i má»i tháº¥t báº¡i.");
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StaffStatusValue }) => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.STAFF.STATUS(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setActionDialog(null);
    },
  });

  // Roles mutation
  const rolesMutation = useMutation({
    mutationFn: async ({ id, roleSlugs }: { id: string; roleSlugs: string[] }) => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.STAFF.ROLES(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleSlugs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật vai trò thất bại.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setEditingStaffId(null);
    },
  });

  // Force Log Out mutation
  const forceLogoutMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const res = await backOfficeFetch(API_ENDPOINTS.BACK_OFFICE.SESSIONS.BY_STAFF(staffId), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không thể đăng xuất phiên làm việc của nhân viên.");
      return res.json();
    },
    onSuccess: () => {
      setActionDialog(null);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const handleRoleToggle = (slug: string) => {
    if (inviteRoles.includes(slug)) {
      setInviteRoles(inviteRoles.filter((r) => r !== slug));
    } else {
      setInviteRoles([...inviteRoles, slug]);
    }
  };

  const handleEditRoleToggle = (slug: string) => {
    if (editRoles.includes(slug)) {
      setEditRoles(editRoles.filter((r) => r !== slug));
    } else {
      setEditRoles([...editRoles, slug]);
    }
  };

  const handleStatusChange = (id: string, currentStatus?: StaffStatusValue | null) => {
    const staff = staffList?.find((row) => row.id === id);
    if (!staff) return;
    const newStatus =
      currentStatus === StaffStatus.ACTIVE ? StaffStatus.SUSPENDED : StaffStatus.ACTIVE;
    setActionDialog({ type: "status", staff, nextStatus: newStatus });
  };

  return (
    <Page>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Users className="h-7 w-7 text-gold" /> Quản trị Nhân sự
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Mời nhân sự mới, phân quyền truy cập và kiểm soát bảo mật hệ thống.
          </p>
        </div>
        <button
          onClick={() => {
            setInviteError(null);
            setInviteSuccess(null);
            setShowInviteModal(true);
          }}
          className="bg-gold hover:bg-gold/90 text-gold-foreground rounded px-4 py-2 text-[12px] font-medium tracking-wide flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Mời Nhân sự mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Panel
          title="Danh sách thành viên Maison"
          subtitle="Tất cả nhân viên có quyền truy cập back-office"
          padded={false}
        >
          <ResourceTable
            rows={staffList || []}
            getRowKey={(staff) => staff.id}
            isLoading={listLoading}
            error={listError}
            onRetry={() => void refetch()}
            emptyTitle="Chưa có nhân sự"
            emptyDescription="Mời nhân sự mới để bắt đầu quản trị back-office."
            columns={[
              {
                key: "name",
                header: "Thành viên / Email",
                render: (r: StaffRow) => (
                  <div>
                    <div className="font-semibold text-foreground text-[13px]">
                      {r.fullName || "Chưa kích hoạt"}
                      {r.id === me?.id && (
                        <span className="ml-1.5 bg-gold/10 border border-gold/20 text-gold text-[9px] px-1 rounded font-bold uppercase tracking-wider">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {r.email}
                    </div>
                  </div>
                ),
              },
              {
                key: "department",
                header: "Phòng ban",
                render: (r: StaffRow) => (
                  <span className="text-[12px] text-foreground">
                    {r.staffProfile?.department || "General"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Trạng thái",
                render: (r: StaffRow) => <StatusBadge status={r.staffProfile?.staffStatus} />,
              },
              {
                key: "roles",
                header: "Vai trò quản trị",
                render: (r: StaffRow) => (
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {r.roles.map((role: string) => (
                      <span
                        key={role}
                        className="bg-accent border border-border text-foreground px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold uppercase"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                key: "mfa",
                header: "MFA",
                render: (r: StaffRow) => (
                  <span className="text-[12px]">
                    {r.staffProfile?.mfaEnabled ? (
                      <span className="text-success font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Bật
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 flex items-center gap-1">
                        <Ban className="h-3.5 w-3.5" /> Tắt
                      </span>
                    )}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Thao tác",
                className: "text-right pr-4",
                render: (r: StaffRow) => {
                  const isSelf = r.id === me?.id;
                  return (
                    <div className="flex justify-end gap-2">
                      {/* Edit Roles */}
                      <button
                        disabled={isSelf}
                        onClick={() => {
                          setEditingStaffId(r.id);
                          setEditRoles(r.roles);
                        }}
                        className="text-gold hover:bg-gold/10 border border-border/80 p-1.5 rounded transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Thay đổi vai trò phân quyền"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      {/* Suspend/Re-activate */}
                      <button
                        disabled={isSelf}
                        onClick={() => handleStatusChange(r.id, r.staffProfile?.staffStatus)}
                        className={`p-1.5 rounded border transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                          r.staffProfile?.staffStatus === StaffStatus.SUSPENDED
                            ? "text-success hover:bg-success/10 border-success/20"
                            : "text-destructive hover:bg-destructive/10 border-destructive/20"
                        }`}
                        title={
                          r.staffProfile?.staffStatus === StaffStatus.SUSPENDED
                            ? "Kích hoạt lại"
                            : "Đình chỉ tài khoản"
                        }
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>

                      {/* Force Logout sessions */}
                      <button
                        disabled={isSelf}
                        onClick={() => setActionDialog({ type: "logout", staff: r })}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-border/80 p-1.5 rounded transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Đăng xuất khỏi mọi thiết bị"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />
        </Panel>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-[480px] p-6 shadow-2xl relative">
            <h2 className="text-display text-xl font-medium text-foreground mb-1">
              Mời thành viên mới
            </h2>
            <p className="text-[11.5px] text-muted-foreground mb-4">
              Hệ thống sẽ gửi email chứa liên kết kích hoạt tài khoản.
            </p>

            {inviteError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11.5px] p-3 rounded-md mb-4 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="bg-success/10 border border-success/20 text-success text-[11.5px] p-3 rounded-md mb-4 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Địa chỉ Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@rayparadis.com"
                    className="w-full bg-background border border-border focus:border-gold rounded px-3 py-2 pl-9 text-[12.5px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Phòng ban (Department)
                </label>
                <input
                  type="text"
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  placeholder="Sales, Artistry, Finance..."
                  className="w-full bg-background border border-border focus:border-gold rounded px-3 py-2 text-[12.5px] outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Chọn các vai trò phân quyền
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto scrollbar-thin border border-border/80 bg-background/50 rounded p-2.5">
                  {rolesLoading ? (
                    <div className="text-[12px] text-muted-foreground">Đang tải vai trò...</div>
                  ) : rolesError ? (
                    <button
                      type="button"
                      onClick={() => void refetchRoles()}
                      className="text-left text-[12px] text-destructive underline"
                    >
                      Không tải được vai trò. Thử lại.
                    </button>
                  ) : (
                    roleOptions.map((role) => (
                      <label
                        key={role.slug}
                        className="flex items-center gap-2 text-[12px] text-foreground select-none cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={inviteRoles.includes(role.slug)}
                          onChange={() => handleRoleToggle(role.slug)}
                          className="rounded accent-gold h-3.5 w-3.5 border-border"
                        />
                        <span>{role.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 border border-border hover:bg-accent rounded py-2 text-[12px] font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={inviteMutation.isPending || !inviteEmail || inviteRoles.length === 0}
                  onClick={() => inviteMutation.mutate()}
                  className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90 rounded py-2 text-[12px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {inviteMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Gửi lời mời"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Roles Modal */}
      {editingStaffId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-[420px] p-6 shadow-2xl relative">
            <h2 className="text-display text-xl font-medium text-foreground mb-1">
              Chỉnh sửa vai trò phân quyền
            </h2>
            <p className="text-[11.5px] text-muted-foreground mb-4">
              Thay đổi quyền truy cập của nhân viên. Các phiên làm việc hiện tại của nhân viên sẽ bị
              hủy để cập nhật quyền.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 border border-border/80 bg-background/50 rounded p-2.5">
                {rolesLoading ? (
                  <div className="text-[12px] text-muted-foreground">Đang tải vai trò...</div>
                ) : rolesError ? (
                  <button
                    type="button"
                    onClick={() => void refetchRoles()}
                    className="text-left text-[12px] text-destructive underline"
                  >
                    Không tải được vai trò. Thử lại.
                  </button>
                ) : (
                  roleOptions.map((role) => (
                    <label
                      key={role.slug}
                      className="flex items-center gap-2 text-[12px] text-foreground select-none cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role.slug)}
                        onChange={() => handleEditRoleToggle(role.slug)}
                        className="rounded accent-gold h-3.5 w-3.5 border-border"
                      />
                      <span>{role.name}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStaffId(null)}
                  className="flex-1 border border-border hover:bg-accent rounded py-2 text-[12px] font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={rolesMutation.isPending || editRoles.length === 0}
                  onClick={() => rolesMutation.mutate({ id: editingStaffId, roleSlugs: editRoles })}
                  className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90 rounded py-2 text-[12px] font-medium tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {rolesMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ActionDialog
        open={actionDialog !== null}
        onOpenChange={(open) => {
          if (!open) setActionDialog(null);
        }}
        destructive={
          actionDialog?.type === "status" && actionDialog.nextStatus === StaffStatus.SUSPENDED
        }
        title={
          actionDialog?.type === "logout"
            ? "Đăng xuất toàn bộ phiên"
            : actionDialog?.nextStatus === StaffStatus.SUSPENDED
              ? "Đình chỉ tài khoản nhân sự"
              : "Kích hoạt lại tài khoản nhân sự"
        }
        description={
          actionDialog?.type === "logout"
            ? `Kết thúc mọi phiên đang hoạt động của ${actionDialog.staff.email}.`
            : actionDialog
              ? `Cập nhật trạng thái của ${actionDialog.staff.email}. Backend vẫn là nguồn kiểm soát quyền truy cập.`
              : ""
        }
        confirmLabel={
          actionDialog?.type === "logout"
            ? "Đăng xuất"
            : actionDialog?.nextStatus === StaffStatus.SUSPENDED
              ? "Đình chỉ"
              : "Kích hoạt"
        }
        cancelLabel="Hủy"
        isPending={statusMutation.isPending || forceLogoutMutation.isPending}
        error={statusMutation.error ?? forceLogoutMutation.error}
        onConfirm={() => {
          if (!actionDialog) return;
          if (actionDialog.type === "logout") {
            forceLogoutMutation.mutate(actionDialog.staff.id);
            return;
          }
          statusMutation.mutate({
            id: actionDialog.staff.id,
            status: actionDialog.nextStatus,
          });
        }}
      />
    </Page>
  );
}
