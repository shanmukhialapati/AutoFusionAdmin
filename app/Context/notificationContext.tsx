import { fetchEventSource } from "@microsoft/fetch-event-source";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import axiosInstance from "../../axios/axiosInstance";

// --- ENVIRONMENT SAFE NOTIFICATIONS INITIALIZATION ---
let Notifications: any = null;

if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  // We only require the library if we are in a browser or on mobile
  Notifications = require("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationItem {
  link: any;
  id: string;
  title: string;
  message: string;
  time: string;
  type: "urgent" | "info" | "success";
  read: boolean;
  category?: string;
  severity: string;
  createdAt?: string;
  referenceType: string;
  referenceId: string;
  actionable?: boolean;
  starred: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  deactivateDevice: () => Promise<void>;
  triggerPopup: (msg: string, severity?: string) => void;
  toast: { severity: string; visible: boolean; message: string };
  refreshNotifications: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  isLoadingNotifs: boolean;
  isLastNotifPage: boolean;
  notifPage: number;
  toggleStar: (id: string, isStarred: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "", severity: "INFO" });
  const [notifPage, setNotifPage] = useState(0);
  const [isLastNotifPage, setIsLastNotifPage] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const router = useRouter();
  const BASE_URL = "http://192.168.0.54:8081/api";

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "#FF3B30";
      case "SUCCESS": return "#4CD964";
      case "INFO": return "#007AFF";
      default: return "#333";
    }
  };

  const mapBackendToUI = (data: any): NotificationItem => ({
    id: data.id?.toString() || Math.random().toString(),
    title: data.title || (data.type ? data.type.replace(/_/g, " ") : "System Update"),
    message: data.message || "New activity recorded",
    time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
    type: data.priority === "HIGH" ? "urgent" : data.priority === "NORMAL" ? "info" : "success",
    read: !!data.read,
    severity: data.priority || "INFO",
    createdAt: data.createdAt,
    referenceType: data.referenceType,
    referenceId: data.referenceId,
    actionable: data.actionable ?? !!data.link,
    link: data.link,
    starred: !!data.starred,
  });

  // 1. Updated token loader using user_session object
  useEffect(() => {
    const loadToken = async () => {
      try {
        const session = await AsyncStorage.getItem("user_session");
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.token) setToken(parsed.token);
        }
      } catch (e) {
        console.error("Token load error", e);
      }
    };
    loadToken();
  }, []);

  // 2. Automated registration logic
  useEffect(() => {
    if (token && !isRegistered) {
      registerDeviceWithBackend();
    }
  }, [token, isRegistered]);

  const registerDeviceWithBackend = async () => {
    if (!Notifications || Platform.OS === "web") return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      const fcmToken = (await Notifications.getDevicePushTokenAsync()).data;
      await axiosInstance.post(`${BASE_URL}/notifications/register`,
        { deviceToken: fcmToken, deviceType: "ANDROID" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsRegistered(true);
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    } catch (error) {
      console.error("Push Registration failed:", error);
    }
  };

  const fetchNotifications = async (page = 0) => {
    if (isLoadingNotifs || (isLastNotifPage && page !== 0) || !token) return;
    try {
      setIsLoadingNotifs(true);
      const [historyRes, countRes] = await Promise.all([
        axiosInstance.get(`${BASE_URL}/notifications`, {
          params: { page, size: 5 },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosInstance.get(`${BASE_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const { content, last } = historyRes.data;
      const newData = content.map(mapBackendToUI);
      setNotifications(prev => (page === 0 ? newData : [...prev, ...newData]));
      setIsLastNotifPage(last);
      setNotifPage(page);
      setUnreadCount(Number(countRes.data));
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications(0);
  }, [token]);

  // 3. Real-time Subscription (SSE)
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    fetchEventSource(`${BASE_URL}/notifications/subscribe`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (ev.event === "unread-count") {
          setUnreadCount(Number(ev.data));
          return;
        }
        if (ev.data) {
          try {
            const newNotif = mapBackendToUI(JSON.parse(ev.data));
            setNotifications(prev => prev.some(n => n.id === newNotif.id) ? prev : [newNotif, ...prev]);
            fetchNotifications()
            triggerPopup(`${newNotif.title}: ${newNotif.message}`, newNotif.severity);
          } catch (e) { console.error("SSE Parse Error", e); }
        }
      },
      onerror: (err) => { console.warn("SSE Retrying...", err); return 3000; },
    });

    return () => controller.abort();
  }, [token]);

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/images/sounds/notification.mp3"));
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); });
    } catch (err) { console.error("Sound Error", err); }
  };

  const triggerPopup = (msg: string, severity: string = "INFO") => {
    setToast({ visible: true, message: msg, severity });
    setTimeout(() => setToast({ visible: false, message: "", severity: "INFO" }), 4000);
  };

  const readNotification = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.read) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(prev - 1, 0));
    try {
      await axiosInstance.put(`${BASE_URL}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axiosInstance.put(`${BASE_URL}/notifications/read-all`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      triggerPopup("All marked as read", "SUCCESS");
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
  };

  const deleteAllNotifications = async () => {
    try {
      await axiosInstance.delete(`${BASE_URL}/notifications/delete-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
      triggerPopup("All deleted", "SUCCESS");
    } catch (e) { console.error(e); }
  };

  const toggleStar = async (id: string, isStarred: boolean) => {
    try {
      await axiosInstance.patch(`${BASE_URL}/notifications/${id}/star`, null, {
        params: { starred: isStarred },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, starred: isStarred } : n));
    } catch (e) { console.error(e); }
  };

  const deactivateDevice = async () => {
    if (!Notifications) return;
    try {
      const fcmToken = (await Notifications.getDevicePushTokenAsync())?.data;
      if (fcmToken && token) {
        await axiosInstance.delete(`${BASE_URL}/devices/${fcmToken}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) { console.error(e); }
  };

  const refreshNotifications = async () => {
    const session = await AsyncStorage.getItem("user_session");
    if (session) {
      setToken(JSON.parse(session).token);
      setIsRegistered(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications, unreadCount, readNotification, markAllAsRead,
        deleteNotification, triggerPopup, toast, deactivateDevice,
        refreshNotifications, fetchNotifications, isLoadingNotifs,
        isLastNotifPage, deleteAllNotifications, toggleStar, notifPage,
      }}
    >
      {children}
      {toast.visible && (
        <View style={[styles.globalToast, { borderLeftColor: getSeverityColor(toast.severity) }]}>
          <Text style={styles.toastTypeLabel}>{toast.severity}</Text>
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  globalToast: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 6,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toastTypeLabel: { fontSize: 12, fontWeight: "800", marginRight: 10 },
  toastMessage: { fontSize: 13, flex: 1 },
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
};