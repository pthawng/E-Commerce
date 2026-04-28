import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Notification, notificationApi } from "@/entities/notification/api/notificationApi";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  isLoading: boolean;

  // Actions
  init: (userId: string) => void;
  disconnect: () => void;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  isLoading: false,

  init: (userId: string) => {
    if (get().socket) return;

    const socket = io("http://localhost:4000/notifications", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to notifications gateway");
      socket.emit("join", userId);
    });

    socket.on("notification", (notification: Notification) => {
      get().addNotification(notification);
    });

    set({ socket });
    get().fetchNotifications();
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await notificationApi.getAll();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  },
}));
