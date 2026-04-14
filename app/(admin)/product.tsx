import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { Image, Alert, useWindowDimensions,  } from 'react-native';
import axiosInstance from '@/axios/axiosInstance';
import {Trash2} from 'lucide-react-native'
export default function CategoryScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
 
  const { width } = useWindowDimensions();
  const numColumns = width > 1200 ? 5 : width > 900 ? 4 : width > 600 ? 3 : 2;


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/categories/admin/all');
      setCategories(res.data);
    } catch (e) {
      console.error('Categories fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

const deletee = async (id) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  } else {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/categories/${id}`);
              setCategories(prev => prev.filter(cat => cat.id !== id));
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
      await axiosInstance.patch(`/categories/${id}/toggle-status`, null);
      // In toggleStatus — category.jsx
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, isActive: !cat.isActive } : cat  // ✅
        )
      );

    } catch (e) {
      console.error('Toggle failed', e);
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (activeTab === 'active') return cat.isActive;
    if (activeTab === 'inactive') return !cat.isActive;

    return true;
  });
 
 
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={{ width: `${100 / numColumns}%`, padding: 6 }}
      onPress={() => router.push(`/subcategory?id=${item.id}&name=${item.name}`)}
    >
      <View style={[styles.card, { width: '100%' }, !item.isActive && styles.inactiveCard]}>
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={{
              width: '100%',
              height: 160,
              borderRadius: 8,
              marginBottom: 10,
              backgroundColor: '#FFFFFF' // White background
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: 130, borderRadius: 8, marginBottom: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#CCC', fontSize: 11 }}>No Image</Text>
          </View>
        )}
        <View style={styles.cardTop}>
          <Text style={styles.categoryName}>{item.name}</Text>

          <View
            style={[
              styles.badge,
              item.isActive ? styles.activeBadge : styles.inactiveBadge
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.isActive ? styles.activeBadgeText : styles.inactiveBadgeText
              ]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.editBtn,
              !item.isActive && { opacity: 0.4 }
            ]}
            disabled={!item.isActive}
            onPress={() => {
              if (item.isActive) {
                router.push(`/editcategory?id=${item.id}&name=${item.name}&photoUrl=${item.photoUrl}`);
              }
            }}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              item.isActive ? styles.deactivateBtn : styles.activateBtn,
            ]}
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
    <Trash2 size={16} color='red'></Trash2>
  </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Categories</Text>
            <Text style={styles.pageSubtitle}>{categories.length} total categories</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/addcategory')}>
            <Text style={styles.addBtnText}>+ Add Category</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: '#F2A20C' }]}>{categories.length}</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#111111', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={[styles.statValue, { color: '#111111' }]}>
              {categories.filter(c => c.isActive).length}
            </Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>Inactive</Text>
            <Text style={[styles.statValue, { color: '#F2A20C' }]}>
              {categories.filter(c => !c.isActive).length}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {['all', 'active', 'inactive'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#F2A20C" size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            key={numColumns} // Force re-render when columns change
            data={filteredCategories}
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
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111111' },
  pageSubtitle: { fontSize: 12, color: '#888888', marginTop: 4 },
  addBtn: { backgroundColor: '#F2A20C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#111111', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 10, padding: 14 },
  statLabel: { fontSize: 11, color: '#888888', fontWeight: '600', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#111111' },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'flex-start',
    gap: 30, // Distance
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#F2A20C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999999',
    letterSpacing: 1.5, // Themey
  },
  activeTabText: {
    color: '#111111',
  },
  list: { paddingBottom: 20 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    width: '18%', // Default for 5 columns roughly (100/5 = 20%, minus gaps)
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 7,

  },
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
  inactiveCard: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#111111', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  activeBadge: { backgroundColor: '#EAF3DE' },
  inactiveBadge: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  activeBadgeText: { color: '#27500A' },
  inactiveBadgeText: { color: '#791F1F' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#111111', // Black border
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center'
  },
  editBtnText: { fontSize: 12, fontWeight: '800', color: '#111111' }, // Black text
  toggleBtn: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#F2A20C' // Solid Amber
  },
  deactivateBtn: { backgroundColor: '#F2A20C' },
  activateBtn: { backgroundColor: '#F2A20C' },
  toggleBtnText: { fontSize: 11, fontWeight: '900', color: '#111111' }, // Black text on Amber
});