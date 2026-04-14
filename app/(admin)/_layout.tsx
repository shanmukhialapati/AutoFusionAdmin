import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { SafeStorage } from '../utils/storage';
import Sidebar from '../COMPONENTS/sidebar';
import Navbar from '../COMPONENTS/navbar';
import { NotificationProvider } from "../Context/notificationContext";

export default function AdminLayout() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(false);

  useEffect(() => {
    const authGuard = async () => {
      try {
        const session = await SafeStorage.getItem('user_session');
        if (!session) {
          router.replace('/');
        } else {
          setIsAuthorized(true);
        }
      } catch (e) {
        console.log("[autofusion] Layout Auth Guard using fallback logic", e);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    authGuard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }

  if (!isAuthorized) return null;

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarVisible(!isMobileSidebarVisible);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <NotificationProvider>
    <View style={styles.mainContainer}>

      <Navbar onToggle={toggleSidebar} />

      <View style={styles.container}>
     
        {!isMobile && (
          <View style={[styles.sidebarWrapper, { width: isSidebarCollapsed ? 80 : 280 }]}>
            <Sidebar collapsed={isSidebarCollapsed} />
          </View>
        )}

 
        <View style={styles.contentWrapper}>
          <Slot />
        </View>
      </View>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileSidebarVisible && (
        <View style={styles.mobileDrawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsMobileSidebarVisible(false)} 
          />
          <View style={styles.drawerContent}>
            <Sidebar onClose={() => setIsMobileSidebarVisible(false)} />
          </View>
        </View>
      )}
    </View>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  sidebarWrapper: {
    height: '100%',
    borderRightWidth: 1,
    borderColor: '#222222',
    ...Platform.select({
      ios: { display: 'flex' },
      android: { display: 'flex' },
      web: { display: 'flex' },
    }),
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileDrawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawerContent: {
    width: '70%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    shadowColor: '#F2A20C',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
  },
});
