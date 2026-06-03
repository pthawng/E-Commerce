import { backOfficeJson } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";

export type SystemSettingValue = string | number | boolean;

export type SystemSettingRegistryItem = {
  key: string;
  group: string;
  description: string;
  defaultValue: SystemSettingValue;
  valueType: "boolean" | "number" | "string";
};

export type UpdateSystemSettingsPayload = {
  settings: Record<string, SystemSettingValue>;
  reason?: string;
};

export type UpdateSystemSettingsResult = {
  success: boolean;
  updated: Array<{
    key: string;
    value: SystemSettingValue;
    version: number;
  }>;
};

export const systemSettingsApi = {
  registry() {
    return backOfficeJson<SystemSettingRegistryItem[]>(API_ENDPOINTS.BACK_OFFICE.SETTINGS.REGISTRY);
  },
  all() {
    return backOfficeJson<Record<string, SystemSettingValue>>(
      API_ENDPOINTS.BACK_OFFICE.SETTINGS.BASE,
    );
  },
  update(payload: UpdateSystemSettingsPayload) {
    return backOfficeJson<UpdateSystemSettingsResult>(API_ENDPOINTS.BACK_OFFICE.SETTINGS.BASE, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
