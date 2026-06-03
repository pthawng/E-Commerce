import { useQuery } from "@tanstack/react-query";
import { vipCareApi } from "../api/vipCare.api";

export function useVipCareCommandCenter() {
  return useQuery({
    queryKey: ["vip-care", "command-center"],
    queryFn: () => vipCareApi.commandCenter(),
    staleTime: 60_000,
  });
}

export function useVipCareClients(status?: string) {
  return useQuery({
    queryKey: ["vip-care", "clients", status ?? "all"],
    queryFn: () => vipCareApi.clients(status),
    staleTime: 60_000,
  });
}

export function useVipCareClient(clientId: string) {
  return useQuery({
    queryKey: ["vip-care", "client", clientId],
    queryFn: () => vipCareApi.client(clientId),
    staleTime: 60_000,
  });
}
