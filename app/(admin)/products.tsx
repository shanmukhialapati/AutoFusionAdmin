import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2, X, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ScrollView,
  Platform,

} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Make sure to install this

const api = 'http://192.168.0.54:8081';
const PAGE_SIZE = 10;

export default function ProductsScreen() {
  const router = useRouter();
  const { subcategoryId, name } = useLocalSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [specsData, setSpecsData] = useState({});
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedVehicles, setLinkedVehicles] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);

  useEffect(() => {
    fetchProducts(0, true);
  }, []);

  useEffect(() => {
    if (modalVisible) {
      fetchVehicleMasterList();
    }
  }, [modalVisible]);

  const fetchProducts = async (page = 0, reset = false) => {
    try {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);

      const session = await AsyncStorage.getItem('user_session');
      if (!session) return;
      const token = JSON.parse(session).token;

      const res = await axios.get(`${api}/api/products/subcategory/${subcategoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, size: PAGE_SIZE },
      });

      const { content, totalPages: tp, totalElements: te } = res.data;
      setProducts(prev => (reset ? content : [...prev, ...content]));
      setTotalPages(tp);
      setTotalElements(te);
      setCurrentPage(page);
    } catch (e) {
      console.error('Products fetch failed', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchVehicleMasterList = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      const res = await axios.get(`${api}/api/vehicles/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllVehicles(res.data);
    } catch (e) {
      console.log("Master List Fetch Error", e);
    }
  };

  const loadLinks = async (pId) => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      const res = await axios.get(`${api}/api/compatibility/product/${pId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinkedVehicles(res.data);
    } catch (e) {
      console.log("Fetch Error", e);
    }
  };
  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      await axios.patch(`${api}/api/products/${productId}/toggle-status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );


      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, isActive: !currentStatus } : p)
      );
    } catch (e) {
      Alert.alert("Error", "Could not update status");
      console.error(e);
    }
  };
  const handleCreateCompatibility = async () => {
    if (!vehicleId) return Alert.alert("Error", "Please select a vehicle");

    try {
      setIsSubmitting(true);
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;

      const payload = {
        productId: selectedProductId,
        vehicleId: parseInt(vehicleId, 10)
      };

      await axios.post(`${api}/api/compatibility`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Success", "Compatibility Linked!");
      setModalVisible(false);
      setVehicleId('');

      setTimeout(() => {
        router.push({
          pathname: '/(admin)/compaform',
          params: { productId: selectedProductId }
        });
      }, 300);
    } catch (e) {
      Alert.alert("Error", "Failed to link vehicle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeLink = async (compId) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this Link? This action cannot be undone.')
      : await new Promise(resolve =>
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to delete this Link?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        )
      );

    if (!confirmed) return;
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      await axios.delete(`${api}/api/compatibility/${compId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadLinks(selectedProductId);
    } catch (e) {
      Alert.alert("Error", "Could not remove link");
    }
  };

  const handleViewSpecs = async (linkId) => {
    if (expandedId === linkId) {
      setExpandedId(null);
      return;
    }

    setLoadingSpecs(true);
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      // GET Specs by Compatibility ID
      const res = await axios.get(`${api}/api/compatibility/${linkId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecsData(prev => ({ ...prev, [linkId]: res.data }));
    } catch (e) {
      setSpecsData(prev => ({ ...prev, [linkId]: null })); // No specs found
    } finally {
      setExpandedId(linkId);
      setLoadingSpecs(false);
    }
  };
  const deleteProduct = async (id) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this product? This action cannot be undone.')
      : await new Promise(resolve =>
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to delete this product?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        )
      );

    if (!confirmed) return;

    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      await axios.delete(`${api}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;

      if (status === 400 && msg) {
        if (Platform.OS === 'web') {
          window.alert(`⚠️ Cannot Delete\n\n${msg}`);
        } else {
          Alert.alert('⚠️ Cannot Delete', msg, [{ text: 'OK' }]);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Could not delete product. Please try again.');
        } else {
          Alert.alert('Error', 'Could not delete product. Please try again.');
        }
      }
      console.error('Delete failed', e);
    }
  };
  const renderProduct = ({ item }) => {
    const imageValid = item.photoUrl && !brokenImages[item.id];
    return (
      // 👇 1. Add opacity to fade the card when inactive
      <View style={[styles.card, !item.isActive && { opacity: 0.5 }]}>
        {imageValid ? (
          <Image source={{ uri: item.photoUrl }} style={styles.cardImage} resizeMode="contain"
            onError={() => setBrokenImages(prev => ({ ...prev, [item.id]: true }))} />
        ) : (
          <View style={styles.noImage}><Text style={styles.noImageText}>No Image</Text></View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => toggleProductStatus(item.id, item.isActive)}
              style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}
            >
              <Text style={[styles.badgeText, item.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sku}>SKU: {item.sku}</Text>
          <Text style={styles.price}>₹{item.price}</Text>

          <View style={styles.actions}>

            <TouchableOpacity
              style={[styles.editBtn, !item.isActive && { opacity: 0.4 }]}
              disabled={!item.isActive}
              onPress={() => router.push(`/editproduct?id=${item.id}`)}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[styles.compBtn, !item.isActive && { opacity: 0.4 }]}
              disabled={!item.isActive}
              onPress={() => {
                setSelectedProductId(item.id);
                setModalVisible(true);
                loadLinks(item.id);
              }}
            >
              <Text style={styles.compBtnText}>+ Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.deleteBtn, !item.isActive && { opacity: 0.4 }]}
              disabled={!item.isActive} onPress={() => deleteProduct(item.id)}>
              <Trash2 size={15} color="#791F1F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Products</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push(`/addproduct?subcategoryId=${subcategoryId}`)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
      />

      {/* --- SIMPLE PICKER MODAL --- */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compatibility</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Linked Vehicles Section with fixed max-height */}
            {/* Linked Vehicles Section with Updated Toggle Logic */}
            <View style={{ maxHeight: 300 }}>
              <Text style={styles.sectionLabel}>Linked Vehicles</Text>
              <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                <View style={styles.linkedContainer}>
                  {linkedVehicles.length > 0 ? (
                    linkedVehicles.map((item) => (
                      <View key={item.id} style={styles.specWrapper}>
                        {/* Main Row: Vehicle Info and Buttons */}
                        <View style={styles.linkedRow}>
                          <Text style={styles.linkedText}>
                            {item.vehicleBrand} {item.model} ({item.year})
                          </Text>

                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            {/* View Specs Button */}
                            <TouchableOpacity
                              onPress={() => handleViewSpecs(item.id)}
                              style={styles.viewBtn}
                            >
                              <Text style={styles.viewBtnText}>
                                {expandedId === item.id ? 'Hide' : 'View Specs'}
                              </Text>
                            </TouchableOpacity>

                            {/* Trash Icon for Link Removal */}
                            <TouchableOpacity onPress={() => removeLink(item.id)} style={styles.trashBtn}>
                              <Trash2 size={16} color="#791F1F" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Collapsible Details Box: Jab click ho tabhi dikhega */}
                        {expandedId === item.id && (
                          <View style={styles.detailsBox}>
                            {loadingSpecs ? (
                              <ActivityIndicator size="small" color="#111" />
                            ) : specsData[item.id] ? (

                              <View style={styles.specsGrid}>
                                <Text style={styles.specItem}>⚙️ Eng: {specsData[item.id].engineType || 'N/A'}</Text>
                                <Text style={styles.specItem}>⛽ Tank: {specsData[item.id].tank || 'N/A'}L</Text>
                                <Text style={styles.specItem}>🛑 Brake: {specsData[item.id].brakeType || 'N/A'}</Text>
                                <Text style={styles.specItem}>🛡️ ABS: {specsData[item.id].abs ? 'Yes' : 'No'}</Text>
                              </View>
                            ) : (

                              <TouchableOpacity
                                style={styles.addSpecsBtn}
                                onPress={() => {
                                  setModalVisible(false);
                                  router.push({
                                    pathname: '/(admin)/compaform',
                                    params: { vehicleCompatibilityId: item.id }
                                  });
                                }}
                              >
                                <Text style={styles.addSpecsBtnText}>+ Add Technical Specs</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No vehicles linked.</Text>
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Select Vehicle to Link</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={vehicleId}
                onValueChange={(itemValue) => setVehicleId(itemValue)}
                dropdownIconColor="#111"
                style={styles.picker}
                mode="dropdown" // Android par isse popup ki tarah khulega
              >
                <Picker.Item label="Choose a vehicle..." value="" color="#999" />
                {allVehicles.map((v) => (
                  <Picker.Item
                    key={v.id}
                    label={`${v.brand} ${v.model} (${v.year})`}
                    value={v.id.toString()}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !vehicleId && { backgroundColor: '#ccc' }]}
                onPress={handleCreateCompatibility}
                disabled={!vehicleId || isSubmitting}
              >
                <Text style={styles.confirmBtnText}>{isSubmitting ? '...' : 'Link Now'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 }, // Background light gray kiya
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  specWrapper: {
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden' // Taaki details box corners rounded rahein
  },
  viewBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },
  detailsBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  specItem: {
    width: '48%',
    fontSize: 11,
    color: '#444',
    marginBottom: 5,
    fontWeight: '500'
  },
  addSpecsBtn: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB'
  },
  addSpecsBtnText: {
    color: '#1976D2',
    fontWeight: '800',
    fontSize: 12
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111' },

  linkedContainer: { marginBottom: 15 },
  linkedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee'
  },
  linkedText: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  trashBtn: { padding: 5 },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },

  pickerWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
    overflow: 'hidden',
    marginBottom: 20
  },
  picker: { height: 55, width: '100%' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f1f1' },
  confirmBtn: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#111' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtnText: { color: '#666', fontWeight: '700', fontSize: 15 },

  noDataText: { textAlign: 'center', color: '#999', marginVertical: 10, fontSize: 13 },
  addBtn: {
    backgroundColor: '#F2A20C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2 // Thodi shadow
  },
  addBtnText: { fontWeight: '700', color: '#000' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f1f1f1'
  },
  cardBody: { flex: 1, marginLeft: 20, justifyContent: 'space-between' },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontWeight: '700', fontSize: 16, color: '#111', flex: 1, marginRight: 5 },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, elevation: 1 },
  activeBadge: { backgroundColor: '#E8F5E9' },
  inactiveBadge: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 13, fontWeight: '800' },

  sku: { fontSize: 12, color: '#666', marginTop: 2 },
  price: { fontSize: 18, fontWeight: '800', color: '#111', marginVertical: 4 },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'center'
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8
  },
  editBtnText: { fontSize: 13, fontWeight: '600' },

  compBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8
  },
  compBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  deleteBtn: {
    backgroundColor: '#FFF1F1',
    padding: 12,
    borderRadius: 10,
    marginLeft: 'auto'
  },


  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  pickerContainer: {
    borderWidth: 1.5, // Thoda thick border
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginTop: 5,
    overflow: 'hidden'
  }
});