import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  useWindowDimensions,
  Platform,
  Alert
} from 'react-native';
import { ArrowLeft,Trash2 } from 'lucide-react-native';

import axiosInstance from '@/axios/axiosInstance';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

export default function SubcategoryScreen() {
  const router = useRouter();
  const { id: categoryId, name: categoryName } = useLocalSearchParams();

  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const { width } = useWindowDimensions();
  const numColumns = width > 1200 ? 5 : width > 900 ? 4 : width > 600 ? 3 : 2;

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories();
    }
  }, [categoryId]);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/subcategories/admin/category/${categoryId}`);
      setSubcategories(res.data || []);
    } catch (e) {
      console.error('Subcategories fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

const deletee = async (id) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure you want to delete this SubCategory?');
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/subcategories/${id}`);
      setSubcategories(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  } else {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this SubCategory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/subcategories/${id}`);
              setSubcategories(prev => prev.filter(cat => cat.id !== id));
            } catch (e) {
              console.error('Delete failed', e);
            }
          }
        }
      ]
    );
  }
};

  const toggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/subcategories/${id}/toggle-status`, null);
      setSubcategories(prev =>
        prev.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (e) {
      console.error('Toggle failed', e);
    }
  };

  const filtered = subcategories.filter(s => {
    if (activeTab === 'active') return s.isActive;
    if (activeTab === 'inactive') return !s.isActive;
    return true;
  });

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={{ width: `${100 / numColumns}%`, padding: 6 }}
      onPress={() => router.push(`/products?subcategoryId=${item.id}&name=${item.name}`)}
    >
      <View style={[styles.card, !item.isActive && styles.inactiveCard]}>
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        <View style={styles.cardTop}>
          <Text style={styles.subName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, item.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.editBtn, !item.isActive && { opacity: 0.4 }]}
            disabled={!item.isActive}
            onPress={() =>
              router.push(`/editsubcategory?id=${item.id}&name=${item.name}&categoryId=${categoryId}&photoUrl=${item.photoUrl}`)
            }
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => toggleStatus(item.id)}
          >
            <Text style={styles.toggleBtnText}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={[styles.deleteBtn,!item.isActive && {opacity:0.4}]}
  disabled={!item.isActive}
  onPress={() => deletee(item.id)}
>
 <Trash2 size={15} color="#791F1F" />
</TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color="#111111" />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>Subcategories</Text>
              <Text style={styles.pageSubtitle}>{categoryName} - {subcategories.length} items</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push(`/addsubcategory?id=${categoryId}&name=${categoryName}`)}
          >
            <Text style={styles.addBtnText}>+ Add Subcategory</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: '#F2A20C' }]}>{subcategories.length}</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#111111', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={[styles.statValue, { color: '#111111' }]}>
              {subcategories.filter(s => s.isActive).length}
            </Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Inactive</Text>
            <Text style={[styles.statValue, { color: '#F2A20C' }]}>
              {subcategories.filter(s => !s.isActive).length}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['all', 'active', 'inactive'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#F2A20C" size="large" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subcategories found</Text>
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={filtered}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCard}
            numColumns={numColumns}
            columnWrapperStyle={{ justifyContent: 'flex-start' }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111111' },
  pageSubtitle: { fontSize: 12, color: '#888888', marginTop: 2 },
  addBtn: { backgroundColor: '#F2A20C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#111111', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 10, padding: 14 },
  statLabel: { fontSize: 11, color: '#888888', fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#111111' },
  tabs: { flexDirection: 'row', marginBottom: 24, justifyContent: 'flex-start', gap: 30 },
  tab: { paddingVertical: 12, borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#F2A20C' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#999999', letterSpacing: 1.5 },
  activeTabText: { color: '#111111' },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEEEEE', padding: 14 },
  inactiveCard: { opacity: 0.6 },
  cardImage: { width: '100%', height: 130, borderRadius: 8, marginBottom: 10, backgroundColor: '#FFFFFF' },
  noImagePlaceholder: { width: '100%', height: 130, borderRadius: 8, marginBottom: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  noImageText: { color: '#CCC', fontSize: 11 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subName: { fontSize: 14, fontWeight: '700', color: '#111111', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  activeBadge: { backgroundColor: '#EAF3DE' },
  inactiveBadge: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  activeBadgeText: { color: '#27500A' },
  inactiveBadgeText: { color: '#791F1F' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#111111', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  editBtnText: { fontSize: 12, fontWeight: '800', color: '#111111' },
  toggleBtn: { flex: 2, borderRadius: 8, paddingVertical: 7, alignItems: 'center', backgroundColor: '#F2A20C' },
  toggleBtnText: { fontSize: 11, fontWeight: '900', color: '#111111' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#AAAAAA', fontSize: 14, fontWeight: '600' },
  deleteBtn: {
  width: 34,
  height: 34,
  borderRadius: 8,
  backgroundColor: '#FCEBEB',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1.5,
  borderColor: '#791F1F',
},
});