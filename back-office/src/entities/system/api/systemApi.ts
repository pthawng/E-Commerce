import api from "@/shared/api/apiInstance";
export const systemApi = {
  /**      * Fetch all global system configurations      */ getSettings: () =>
    api.get<Record<string, any>>("/admin/system/settings"),
  /**      * Bulk update system configurations      */ updateSettings: (
    settings: Record<string, any>,
  ) => api.patch("/admin/system/settings", { settings }),
  /**      * Fetch active sessions for the current principal      */ getSessions:
    () => api.get<any[]>("/auth/sessions"),
  /**      * Terminate a specific session by its JTI      */ revokeSession: (
    id: string,
  ) => api.delete(`/auth/sessions/${id}`),
};
