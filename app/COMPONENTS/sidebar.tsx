import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Sliders
} from 'lucide-react-native';
import { usePathname, useRouter } from 'expo-router';
import { SafeStorage } from '../utils/storage';
import { X } from 'lucide-react-native';


const SidebarItem = ({ item, isActive, onPress, collapsed }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = (isActive || isHovered) ? '#F2A20C' : '#FFFFFF';
  const subColor = (isActive || isHovered) ? '#F2A20C' : '#444444';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      // @ts-ignore
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[styles.navItem, isActive && styles.activeNavItem, collapsed && styles.collapsedNavItem]}
    >
      <View style={styles.navRow}>
        <item.icon size={22} color={color} />
        {!collapsed && (
          <View style={styles.textStack}>
            <Text style={[styles.navLabel, { color }]}>{item.label}</Text>
            {item.sublabel && <Text style={[styles.navSublabel, { color: subColor }]}>{item.sublabel}</Text>}
          </View>
        )}
      </View>
      {!collapsed && (isActive || isHovered) && <ChevronRight size={18} color="#F2A20C" />}
    </TouchableOpacity>
  );
};


const Sidebar = ({ collapsed, onClose }: { collapsed?: boolean, onClose?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Dashboard',
      sublabel: 'Summary',
      icon: LayoutDashboard,
      route: '/dashboard'
    },
    {
      label: 'Products',
      icon: Package,
      route: '/product'
    },
    {
      label: 'Orders',
      icon: ShoppingCart,
      route: '/orders'
    },
    {
      label: 'Users',
      icon: Users,
      route: '/users'
    },
    {
      label: 'Logs',
      icon: FileText,
      route: '/audit'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      route: '/reports'
    },
    {
      label: 'Vehicles',
      icon: Sliders,
      route: '/vechicles'
    },
    {
      label: 'Security',
      sublabel: 'Change Password',
      icon: ShieldCheck,
      route: '/changePassword'
    },
  ];

  const handleLogout = async () => {
    try {
      await SafeStorage.clear();
      router.replace('/');
    } catch (e) {
      console.error("[autofusion] Logout failed", e);
    }
  };

  const onNavItemPress = (route: string) => {
    router.push(route as any);
    if (onClose) onClose();
  };

  return (
    <View style={[styles.container, collapsed && styles.collapsedContainer]}>

      {onClose && (
        <View style={styles.mobileHeader}>
          <Text style={styles.mobileTitle}>MENU</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#F2A20C" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.navTier}>
          {navItems.map((item) => (
            <SidebarItem
              key={item.route}
              item={item}
              isActive={pathname === item.route}
              onPress={() => onNavItemPress(item.route)}
              collapsed={collapsed}
            />
          ))}
        </View>
      </ScrollView>


      <View style={[styles.footer, collapsed && styles.collapsedFooter]}>



      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 30, // Professional gap below Navbar
    paddingBottom: Platform.OS === 'web' ? 24 : 60,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#1A1A1A',
  },
  collapsedContainer: {
    paddingHorizontal: 12,
  },
  navScroll: {
    flex: 1,
  },
  navTier: {
    gap: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 6,
  },
  collapsedNavItem: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    justifyContent: 'center',
    borderLeftWidth: 0,
  },
  activeNavItem: {
    backgroundColor: 'rgba(212, 142, 13, 0.73)',
    borderLeftWidth: 4,
    borderColor: '#F2A20C',
    paddingLeft: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  textStack: {
    flex: 1,
  },
  navLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  activeNavLabel: {
    color: '#F2A20C',
  },
  navSublabel: {
    fontSize: 10,
    color: '#444444',
    marginTop: 2,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#1A1A1A',
    gap: 16,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  mobileTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  closeButton: {
    padding: 4,
  },
  collapsedFooter: {
    alignItems: 'center',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    backgroundColor: '#0A0A0A',
  },
  collapsedProfileBadge: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileRole: {
    color: '#444444',
    fontSize: 9,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  collapsedLogoutButton: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default Sidebar;
