import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
  Alert, Modal
} from 'react-native';

const api = 'http://192.168.0.54:8081';

export default function OrderScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      const res = await axios.get(`${api}/api/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (e) {
      console.error('Orders fetch failed', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };



  const dispatchOrder = async (id) => {
    try {
      const session = await AsyncStorage.getItem('user_session');
      const token = JSON.parse(session).token;
      await axios.patch(`${api}/api/orders/admin/dispatch/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev =>
        prev.map(o => {
          const oid = o?.id ?? o?.orderId;
          return oid === id ? { ...o, orderStatus: 'DISPATCHED' } : o;
        })
      );
    } catch (e) {
      console.error('Dispatch failed', e);
    }
  };

  const confirmDispatch = (id) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm("Are you sure you want to dispatch?");
      if (ok) dispatchOrder(id);
    } else {
      Alert.alert(
        "Confirm Dispatch",
        "Are you sure you want to dispatch this order?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: () => dispatchOrder(id) },
        ]
      );
    }
  };

  // ✅ Tabs aligned with backend OrderStatus enum
  const tabs = ['all', 'placed', 'dispatched', 'delivered', 'cancelled'];
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true;
    return o?.orderStatus?.toLowerCase() === activeTab;
  });

  const total = orders.length;
  const placed = orders.filter(o => o?.orderStatus?.toLowerCase() === 'placed').length;
  const dispatched = orders.filter(o => o?.orderStatus?.toLowerCase() === 'dispatched').length;

  //  Status styles aligned with backend OrderStatus enum
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'placed') return { bg: '#E3F2FD', color: '#1565C0' };
    if (s === 'dispatched') return { bg: '#F3E5F5', color: '#6A1B9A' };
    if (s === 'delivered') return { bg: '#E8F5E9', color: '#1B5E20' };
    if (s === 'cancelled') return { bg: '#FFEBEE', color: '#B71C1C' };
    return { bg: '#F5F5F5', color: '#555' };
  };
  const renderRow = ({ item, index }) => {
    const orderId = item?.orderId;
    const paymentMode = item?.paymentMode;
    const status = item?.orderStatus;
    const totalAmount = item?.finalAmount ?? item?.total ?? 0;
    const itemCount = item?.orderItems ? item.orderItems.length : 0;

    const statusStyle = getStatusStyle(status);

    const s = status?.toLowerCase();
    return (
      <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
        <Text style={[styles.cell, styles.cellId]} numberOfLines={1}>
          #{orderId}
        </Text>
        <Text style={[styles.cell, styles.cellCustomer]} numberOfLines={1}>
          {paymentMode}
        </Text>
        {isWeb && (
          <Text style={[styles.cell, styles.cellItems]} numberOfLines={1}>
            ₹{(totalAmount).toFixed(2)} | {itemCount} items
          </Text>
        )}

        <View style={[styles.cell, styles.cellStatus]}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.cell, styles.cellActions]}>
          {s === 'placed' && (
            <TouchableOpacity style={styles.dispatchBtn} onPress={() => confirmDispatch(orderId)}>
              <Text style={styles.dispatchBtnText}>Dispatch</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => { setSelectedOrder(item); setViewModalVisible(true); }}
          >
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const formatTabLabel = (tab) => {
    if (tab === 'all') return 'All';
    return tab.charAt(0).toUpperCase() + tab.slice(1);

  };
  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Order Management</Text>
            <Text style={styles.pageSubtitle}>{total} total orders</Text>
          </View>
        </View>
        <View style={styles.statsRow}>

          <View style={[styles.statBox, { borderColor: '#13941e', borderWidth: 1 }]}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={[styles.statValue, { color: '#13941e' }]}>{total}</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#5b1297', borderWidth: 1 }]}>
            <Text style={styles.statLabel}>Placed</Text>
            <Text style={[styles.statValue, { color: '#5b1297' }]}>{placed}</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#941313', borderWidth: 1 }]}>
            <Text style={styles.statLabel}>Dispatched</Text>
            <Text style={[styles.statValue, { color: '#941313' }]}>{dispatched}</Text>
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
                {formatTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.cellId]}>Order ID</Text>
          <Text style={[styles.headerCell, styles.cellCustomer]}>Payment</Text>
          {isWeb && <Text style={[styles.headerCell, styles.cellItems]}>Amount</Text>}
          <Text style={[styles.headerCell, styles.cellStatus]}>Status</Text>
          <Text style={[styles.headerCell, styles.cellActions]}>Actions</Text>
        </View>
        {loading ? (
          <ActivityIndicator color="#F2A20C" size="large" style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => (item?.id ?? item?.orderId).toString()}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
        {/* Order Detail Modal */}
        <Modal visible={viewModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailBox}>

              {/* Header */}
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Order #{selectedOrder?.orderId}</Text>
                <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                  <Text style={styles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Info Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(selectedOrder?.orderStatus).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusStyle(selectedOrder?.orderStatus).color }]}>
                    {selectedOrder?.orderStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment</Text>
                <Text style={styles.detailValue}>{selectedOrder?.paymentMode}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.detailValue}>₹{selectedOrder?.finalAmount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Cost</Text>
                <Text style={styles.detailValue}>₹{selectedOrder?.deliveryCost ?? 0}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>{selectedOrder?.orderItems?.length ?? 0} items</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Item List */}
              <Text style={styles.itemsHeading}>Order Items</Text>
              {selectedOrder?.orderItems?.map((oi) => (
                <View key={oi.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{oi.pname}</Text>
                    <Text style={styles.itemSub}>Qty: {oi.quantity}  |  Discount: {oi.discount}%</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{oi.totalPrice}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setViewModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

    </>
  );

}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  pageSubtitle: { fontSize: 12, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 10, padding: 12, borderColor: '#F2A20C', borderWidth: 0.5 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', marginBottom: 12, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderColor: 'transparent', marginBottom: -1 },
  activeTab: { borderColor: '#F2A20C' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  activeTabText: { color: '#111' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F2A20C', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  headerCell: { fontSize: 12, fontWeight: '700', color: '#0c0a0a' },
  row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: '#F2F2F2' },
  rowAlt: { backgroundColor: '#FAFAFA' },
  cell: { fontSize: 13, color: '#333' },
  cellId: { width: 80 },
  cellCustomer: { flex: 1 },

  cellItems: { width: 160 },
  cellStatus: { width: 110, alignItems: 'flex-start' },
  cellActions: { flexDirection: 'row', gap: 8, width: 140, justifyContent: 'flex-start', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },
  viewBtn: { borderWidth: 1, borderColor: '#DDD', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  dispatchBtn: { backgroundColor: '#F2A20C', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  dispatchBtnText: { fontSize: 12, fontWeight: '700', color: '#111' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#AAA' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 480 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  closeX: { fontSize: 18, color: '#888', fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#111' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 14 },
  itemsHeading: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, padding: 10, backgroundColor: '#FAFAFA', borderRadius: 8 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#111' },
  itemSub: { fontSize: 11, color: '#888', marginTop: 3 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#F2A20C' },
  closeBtn: { marginTop: 16, backgroundColor: '#F2A20C', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },
});