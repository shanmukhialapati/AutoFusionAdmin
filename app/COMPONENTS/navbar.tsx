import { LinearGradient } from 'expo-linear-gradient';
import { Bell, LogOut, Menu } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeStorage } from '../utils/storage';
import { useNotifications } from "../Context/notificationContext";
import NotificationDrawer from "./NotificationDrawer";
interface NavbarProps {
  onToggle?: () => void;
  onNotificationsPress?: () => void;
}

export default function Navbar({ onToggle, onNotificationsPress }: NavbarProps) {
  const router = useRouter();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        console.log('[autofusion] Terminating administrative session...');
        await SafeStorage.clear();
        router.replace('/');
      } catch (e) {
        console.error("[autofusion] Logout operation failed", e);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Logout Confirmation: Are you sure you want to exit the command hub?');
      if (confirmed) performLogout();
    } else {
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to exit the command hub?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: performLogout },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#111111', '#444444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.navbar}
      >
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.brand}>
            AUTO<Text style={styles.brandHighlight}>FUSION</Text>
          </Text>
        </View>



        <View style={styles.rightSection}>

          <TouchableOpacity
            onPress={() => setIsNotifyOpen(true)
            }
          >
            <Bell color="white" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <NotificationDrawer
            isOpen={isNotifyOpen}
            onClose={() => setIsNotifyOpen(false)}
          />
          <TouchableOpacity style={styles.avatarButton} onPress={handleLogout}>
            <LogOut size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#111111',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: Platform.OS === 'web' ? 64 : 85,
    paddingTop: Platform.OS === 'web' ? 0 : 25,
    borderBottomWidth: 1,
    borderColor: '#1A1A1A',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'web' ? 15 : 5,
  },
  menuButton: {
    padding: Platform.OS === 'web' ? 4 : 0,
    marginLeft: Platform.OS === 'web' ? 0 : -10,
  },
  brand: {
    fontFamily: 'Montserrat-Bold',
    fontSize: Platform.OS === 'web' ? 18 : 14,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  brandHighlight: {
    color: '#F2A20C',
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: Platform.OS === 'web' ? 4 : 0,
    marginRight: Platform.OS === 'web' ? 15 : 0,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2A20C',
    borderWidth: 1,
    borderColor: '#111111',

  },
  avatarButton: {
    padding: Platform.OS === 'web' ? 4 : 0,
    marginRight: Platform.OS === 'web' ? 15 : 0,
  },
  badgeContainer: {
    position: "absolute",
    top: -10,
    right: -6,
    backgroundColor: "#ff0000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "bold" },
});
