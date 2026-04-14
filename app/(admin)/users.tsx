import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const api = 'http://192.168.0.54:8081';

export default function UserManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Users');// tab position
  const [modalVisible, setModalVisible] = useState(false);//modal visibility
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [admin, setAdmin] = useState([]);
  const [user, setUser] = useState([]);
  const [errors, setErrors] = useState({});
  const usercount = user.length;
  const admincount = admin.length;
  const totalCount = usercount + admincount;
  const tabs = ['Users', 'Admins'];
  const alladmin = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) return;
      const token = JSON.parse(session)?.token;
      const res = await axios.get(`${api}/api/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin(res.data.data);
    } catch (e) {
      console.error('Admin fetch failed', e);
    }
  };

  const alluser = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      if (!session) return;
      const token = JSON.parse(session)?.token;
      const res = await axios.get(`${api}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.data);
    } catch (e) {
      console.error('User fetch failed', e);
    }
  };

  const handleAddAdmin = async () => {
    if (!validate()) return;
    try {
      setCreating(true);
      const session = await AsyncStorage.getItem('user_session');
      if (!session) return;
      const token = JSON.parse(session)?.token;
      await axios.post(
        `${api}/api/auth/admin/create`,
        { username, email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Admin created successfully');
      setModalVisible(false);
      setUsername('');
      setEmail('');
      setPassword('');
      alladmin();
    } catch (e) {
      console.log("error", e);
    } finally {
      setCreating(false);
    }
  };
  const validate = () => {
    let tempErrors = {};

    // 1. Username: Sirf letters aur spaces
    if (!username.trim()) {
      tempErrors.username = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(username)) {
      tempErrors.username = "Only letters allowed";
    }
    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!email.endsWith("@gmail.com")) {
      tempErrors.email = "Only @gmail.com allowed";
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
    if (!password) {
      tempErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      tempErrors.password = "Need 8+ chars, Uppercase, Lowercase, Number & Symbol";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };
  useEffect(() => {
    alluser();
    alladmin();
  }, []);
  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        <Text style={styles.avatarText}>
          {(item?.username?.charAt(0)).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item?.username}</Text>
        <Text style={styles.cardSub}>{item?.email}</Text>
        <Text style={styles.cardSub}>{item?.phone}</Text>
      </View>
      <View style={[styles.badge, activeTab === 'Admins' ? styles.adminBadge : styles.userBadge]}>
        <Text style={[styles.badgeText, activeTab === 'Admins' ? styles.adminBadgeText : styles.userBadgeText]}>
          {activeTab === 'Admins' ? 'Admin' : 'User'}
        </Text>
      </View>
    </View>
  );
  const data = activeTab === 'Users' ? user : admin;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>User Management</Text>
          <Text style={styles.pageSubtitle}>
            {data.length} {activeTab === 'Users' ? 'Users' : 'Admins'} total
          </Text>
        </View>
        {activeTab === 'Admins' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add Admin</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: '#13941e', borderWidth: 2 }]}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: '#13941e' }]}>{totalCount}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#5b1297', borderWidth: 2 }]}>
          <Text style={styles.statLabel}>Users</Text>
          <Text style={[styles.statValue, { color: '#5b1297' }]}>{usercount}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: '#941313', borderWidth: 2 }]}>
          <Text style={styles.statLabel}>Admins</Text>
          <Text style={[styles.statValue, { color: '#941313' }]}>{admincount}</Text>
        </View>
      </View>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item?.userId}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Admin</Text>
            <TextInput
              style={[styles.input, errors.username && { borderColor: '#941313' }]}
              placeholder="Username*"
              value={username}
              onChangeText={(val) => { setUsername(val); setErrors({ ...errors, username: '' }); }}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            <TextInput
              style={[styles.input, errors.email && { borderColor: '#941313' }]}
              placeholder="Email*"
              value={email}
              onChangeText={(val) => { setEmail(val); setErrors({ ...errors, email: '' }); }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password Field */}
            <TextInput
              style={[styles.input, errors.password && { borderColor: '#941313' }]}
              placeholder="Password*"
              secureTextEntry
              value={password}
              onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: '' }); }}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setUsername('');
                  setEmail('');
                  setPassword('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleAddAdmin}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#111111" size="small" />
                  : <Text style={styles.createBtnText}>Create</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111111' },
  pageSubtitle: { fontSize: 12, color: '#888888', marginTop: 4 },
  addBtn: { backgroundColor: '#F2A20C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#111111', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 10, padding: 14, borderWidth: 1 },
  statLabel: { fontSize: 11, color: '#888888', fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111111' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 16, backgroundColor: '#F2A20C', borderRadius: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 2, borderColor: 'transparent', marginBottom: -1 },
  activeTab: { backgroundColor: '#ffb223', borderWidth: 1, borderRadius: 5 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#1a1717' },
  activeTabText: { color: '#111111' },
  list: { paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  inactiveCard: { opacity: 0.5 },
  errorText: {
    color: '#941313',
    fontSize: 10,
    marginTop: -10, // Input ke kareeb lane ke liye
    marginBottom: 10,
    marginLeft: 5,
    fontWeight: '600',
  },
  avatarBox: {
    width: 45,
    height: 45,
    borderRadius: 21,
    backgroundColor: '#F2A20C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#111111' },
  cardInfo: { flex: 1, marginLeft: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111111' },
  cardSub: { fontSize: 13, color: '#888888', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '40%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111111',
    marginBottom: 12,
    backgroundColor: '#F7F7F7',
  },
  badge: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 20 },
  adminBadge: { backgroundColor: '#FEF3C7' },
  userBadge: { backgroundColor: '#EDE9FE' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  adminBadgeText: { color: '#92400E' },
  userBadgeText: { color: '#6D28D9' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#555555' },
  createBtn: { flex: 1, backgroundColor: '#F2A20C', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#111111' },
});