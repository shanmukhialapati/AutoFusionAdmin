import { useRouter } from "expo-router";
import { BellOff, Star, Trash2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  NotificationItem,
  useNotifications,
} from "../Context/notificationContext";
interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
const { width } = Dimensions.get("window");
const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    readNotification,
    markAllAsRead,
    unreadCount,
    toast,
    fetchNotifications,
    isLoadingNotifs,
    isLastNotifPage,
    notifPage,
    toggleStar,
    deleteAllNotifications,
    deleteNotification,
  } = useNotifications();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [alertVisible, setAlertVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Unread" | "Read" | "Favourites"
  >("All");

  const router = useRouter();
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [isOpen]);

  const filteredData = useMemo(() => {
    if (activeFilter === "All") return notifications;
    if (activeFilter === "Unread") return notifications.filter((n) => !n.read);
    if (activeFilter === "Read") return notifications.filter((n) => n.read);
    if (activeFilter === "Favourites")
      return notifications.filter((n) => n.starred);
    return notifications;
  }, [notifications, activeFilter]);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const getSeverityColor = () => {
    switch (toast.severity) {
      case "CRITICAL":
        return "#FF3B30";
      case "SUCCESS":
        return "#4CD964";
      case "INFO":
        return "#007AFF";
      default:
        return "#333";
    }
  };
  const getDuration = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return past.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  const handleNotificationPress = async (notification: NotificationItem) => {
    await readNotification(notification.id);

    // if (!notification.actionable) {
    //   console.log("Notification is not actionable");
    //   return;
    // }

    let targetPath = "";

    if (notification.link) {
      try {
        const parsedUrl = new URL(notification.link);
        targetPath = parsedUrl.pathname;
      } catch (e) {
        targetPath = notification.link;
      }
    }

    if (targetPath && targetPath !== "/") {
      console.log("Routing to internal path:", targetPath);

      onClose();

      router.push(targetPath as any);
    } else {
      console.warn("No valid target path found in link:", notification.link);
    }
  };
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && !isLoadingNotifs && !isLastNotifPage) {
      fetchNotifications(notifPage + 1);
    }
  };
  const handleConfirmDelete = async () => {
    setAlertVisible(false); // Hide alert
    await deleteAllNotifications(); // Execute deletion
  };
  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={shouldRender}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.drawerOverlay}>
        <TouchableOpacity
          style={styles.drawerCloseArea}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.drawerContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.drawerHeaderText}>Notifications</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.activeDot} />
                <Text style={styles.unreadSubtext}>
                  {unreadCount} New messages
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* DELETE ALL BUTTON */}
              <TouchableOpacity
                onPress={() => setAlertVisible(true)}
                style={styles.actionBtn}
              >
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#1A1A1A" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterBar}>
            <View style={styles.tabs}>
              {(["All", "Unread", "Read", "Favourites"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={[styles.tab, activeFilter === tab && styles.activeTab]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeFilter === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.notificationList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {filteredData.length === 0 ? (
              <View style={styles.notifioff}>
                <View style={styles.iconCircle}>
                  <BellOff color="#CBD5E1" size={40} />
                </View>
                <Text style={styles.emptyText}>No notifications Found!</Text>
              </View>
            ) : (
              <>
                {filteredData.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      !item.read && styles.unreadCard,
                    ]}
                  >
                    {!item.read && <View style={styles.unreadStripe} />}

                    <TouchableOpacity
                      style={styles.notifTextContainer}
                      onPress={() => handleNotificationPress(item)}
                    >
                      <View style={styles.headerRow}>
                        <Text
                          style={[
                            styles.notifTitle,
                            !item.read && styles.boldText,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.notifTime}>
                          {getDuration(
                            item.createdAt || new Date().toISOString(),
                          )}
                        </Text>
                      </View>
                      <View style={styles.footerRow}>
                        <Text style={styles.notifDesc} numberOfLines={2}>
                          {item.message}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleStar(item.id, !item.starred)}
                          style={styles.starBtn}
                        >
                          <Star
                            size={18}
                            color={item.starred ? "#F2A20C" : "#CBD5E1"}
                            fill={item.starred ? "#F2A20C" : "transparent"}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* <View style={styles.footerRow}>
                      <View
                        style={[
                          styles.severityBadge,
                          {
                            backgroundColor:
                              item.severity === "WARNING"
                                ? "#FFFBEB"
                                : "#F0FDF4",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.severityDot,
                            {
                              backgroundColor:
                                item.severity === "WARNING"
                                  ? "#F2A20C"
                                  : "#22C55E",
                            },
                          ]}
                        />
                       <Text
                          style={[
                            styles.severityText,
                            {
                              color:
                                item.severity === "WARNING"
                                  ? "#B45309"
                                  : "#166534",
                            },
                          ]}
                        >
                          {item.severity}
                        </Text> 
                      </View>

                     
                      <TouchableOpacity
                        onPress={() => toggleStar(item.id, !item.starred)}
                        style={styles.starBtn}
                      >
                        <Star
                          size={18}
                          color={item.starred ? "#F2A20C" : "#CBD5E1"}
                          fill={item.starred ? "#F2A20C" : "transparent"}
                        />
                      </TouchableOpacity>
                    </View> */}
                  </View>
                ))}

                {isLoadingNotifs && (
                  <View style={styles.loaderFooter}>
                    <ActivityIndicator size="small" color="#0666c6" />
                  </View>
                )}

                {isLastNotifPage && filteredData.length > 0 && (
                  <Text style={styles.endOfListText}>
                    No more notifications
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
     
    </Modal>
  );
};

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawerCloseArea: { flex: 1 },
  drawerContent: {
    backgroundColor: "#F8FAFC",
    height: "100%",
    position: "absolute",
    right: 0,
    ...Platform.select({
      web: { width: 400, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" },
      android: { width: "100%" },
      default: { width: "100%" },
    }),
    paddingTop: Platform.OS === "web" ? 20 : 50,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  drawerHeaderText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F2A20C",
    marginRight: 6,
  },
  unreadSubtext: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabs: { flexDirection: "row", gap: Platform.OS === "web" ? 20 : 12 },
  tab: { paddingVertical: 4 },
  activeTab: {
    borderBottomWidth: 1,
    borderColor: "#F2A20C",
  },
  tabText: {
    fontSize: Platform.OS === "web" ? 14 : 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  activeTabText: { color: "#0F172A" },
  markAllText: { fontSize: 13, color: "#F2A20C", fontWeight: "700" },
  notificationList: { flex: 1 },
  // notificationCard: {
  //   backgroundColor: "#FFF",
  //   marginHorizontal: 16,
  //   marginTop: 12,
  //   borderRadius: 12,
  //   padding: 16,
  //   borderWidth: 1,
  //   borderColor: "#F1F5F9",
  //   // Shadow for iOS/Web
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.05,
  //   shadowRadius: 4,
  //   // Elevation for Android
  //   elevation: 2,
  // },
  unreadCard: {
    borderColor: "#F2A20C",
    backgroundColor: "#fae6c230",
    shadowOpacity: 0.1,
  },
  unreadStripe: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 5,
    backgroundColor: "#F2A20C",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  notifTextContainer: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  boldText: { fontWeight: "800", color: "#0F172A" },
  notifDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTime: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  notifioff: {
    alignItems: "center",
    marginTop: 100,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptySubText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2", // Light red background for delete
    justifyContent: "center",
    alignItems: "center",
  },
  starBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  // Update notificationCard to allow for absolute positioning if needed
  notificationCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    position: "relative",
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    paddingVertical: 15,
    fontStyle: "italic",
  },
});

export default NotificationDrawer;