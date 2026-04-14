import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import axiosInstance from '@/axios/axiosInstance';

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  DELIVERED: { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
  CONFIRMED: { bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB' },
  DISPATCHED: { bg: '#FEF9C3', text: '#D97706', dot: '#D97706' },
  PENDING: { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' },
  CANCELLED: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
};
const sc = (s: string) => STATUS_COLOR[s?.toUpperCase()] || { bg: '#F5F5F5', text: '#888', dot: '#CCC' };

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics'>('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');


  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => { fetchOrders(); }, [page]);
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const [ordersRes, totalRes] = await Promise.all([
        axiosInstance.get(`/orders/admin/allorders?page=${page}&size=20`),
        axiosInstance.get('/orders/admin/total-orders'),
      ]);
      setOrders(ordersRes.data.content || []);
      setTotalPages(ordersRes.data.totalPages || 0);
      setTotalOrders(typeof totalRes.data === 'number' ? totalRes.data : totalRes.data?.total || ordersRes.data.totalElements || 0);
    } catch (e) { console.error('Orders fetch error', e); }
    finally { setLoadingOrders(false); }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const [trendRes, productsRes] = await Promise.all([
        axiosInstance.get('/orders/dashboard/sales-trend'),
        axiosInstance.get('/orders/dashboard/top-products'),
      ]);
      setSalesTrend(trendRes.data || []);
      setTopProducts(productsRes.data || []);
    } catch (e) { console.error('Analytics fetch error', e); }
    finally { setLoadingAnalytics(false); }
  };


  const statusTabs = useMemo(() => {
    const unique = Array.from(new Set(orders.map((o: any) => o.orderStatus?.toUpperCase()).filter(Boolean)));
    return ['ALL', ...unique];
  }, [orders]);

  const filtered = useMemo(() =>
    statusFilter === 'ALL' ? orders : orders.filter(o => o.orderStatus?.toUpperCase() === statusFilter),
    [orders, statusFilter]
  );

  const totalRevenue = filtered.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const avgOrder = filtered.length ? totalRevenue / filtered.length : 0;
  const codCount = filtered.filter(o => o.paymentMode === 'COD').length;

  // Status distribution for analytics
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const k = o.orderStatus || 'UNKNOWN';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [orders]);

  // Payment distribution
  const paymentDist = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const k = o.paymentMode || 'UNKNOWN';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([mode, count]) => ({ mode, count }));
  }, [orders]);

  const exportCSV = () => {
    const hdrs = ['Order ID', 'Items', 'Total (₹)', 'Delivery (₹)', 'Final (₹)', 'Status', 'Payment'];
    const rows = filtered.map(o => [
      o.orderId,
      o.orderItems?.map((i: any) => `${i.pname} x${i.quantity}`).join(' | '),
      o.totalAmount?.toFixed(2),
      o.deliveryCost,
      o.finalAmount?.toFixed(2),
      o.orderStatus,
      o.paymentMode,
    ]);
    let csv = hdrs.join(',') + '\n';
    rows.forEach(r => { csv += r.map(c => `"${c}"`).join(',') + '\n'; });
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Orders_${statusFilter}_${new Date().toLocaleDateString('en-IN')}.csv`;
      a.click();
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Order Reports</Text>
          <Text style={s.subtitle}>{totalOrders} total orders</Text>
        </View>
        <View style={s.hActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => { fetchOrders(); if (activeTab === 'analytics') fetchAnalytics(); }}>
            <RefreshCw size={16} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={s.exportBtn} onPress={exportCSV}>
            <Download size={15} color="#000" />
            <Text style={s.exportTxt}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main tabs */}
      <View style={s.mainTabs}>
        {(['orders', 'analytics'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[s.mainTab, activeTab === tab && s.mainTabActive]} onPress={() => setActiveTab(tab)}>
            {tab === 'orders' ? <ShoppingBag size={14} color={activeTab === tab ? '#000' : '#AAA'} /> : <BarChart3 size={14} color={activeTab === tab ? '#000' : '#AAA'} />}
            <Text style={[s.mainTabTxt, activeTab === tab && s.mainTabTxtActive]}>{tab === 'orders' ? 'Orders' : 'Analytics'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {activeTab === 'orders' ? (
          <>
            {/* KPI Row */}
            <View style={s.kpiRow}>
              <Kpi icon={<ShoppingBag size={16} color="#F2A20C" />} label="Showing" value={`${filtered.length}`} bg="#FFF8E7" />
              <Kpi icon={<IndianRupee size={16} color="#10B981" />} label="Revenue" value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} bg="#F0FDF4" />
              <Kpi icon={<TrendingUp size={16} color="#3B82F6" />} label="Avg Order" value={`₹${avgOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} bg="#EFF6FF" />
              <Kpi icon={<Package size={16} color="#8B5CF6" />} label="COD Orders" value={`${codCount}`} bg="#F5F3FF" />
            </View>

            {/* Status filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
              {statusTabs.map(tab => (
                <TouchableOpacity key={tab} style={[s.chip, statusFilter === tab && s.chipActive]} onPress={() => setStatusFilter(tab)}>
                  {tab !== 'ALL' && <View style={[s.chipDot, { backgroundColor: sc(tab).dot }]} />}
                  <Text style={[s.chipTxt, statusFilter === tab && s.chipTxtActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Orders Table */}
            <View style={s.tableCard}>
              {/* Column headers */}
              <View style={s.thead}>
                <Text style={[s.th, { flex: 0.7 }]}>ORDER</Text>
                <Text style={[s.th, { flex: 0.8 }]}>ITEMS</Text>
                <Text style={[s.th, { flex: 1 }]}>AMOUNT</Text>
                <Text style={[s.th, { flex: 1.2 }]}>STATUS</Text>
                <Text style={[s.th, { flex: 0.8 }]}>PAYMENT</Text>
                <Text style={[s.th, { flex: 0.3 }]}></Text>
              </View>

              {loadingOrders ? (
                <View style={s.center}><ActivityIndicator color="#F2A20C" size="large" /><Text style={s.loadTxt}>Loading…</Text></View>
              ) : filtered.length === 0 ? (
                <View style={s.center}><Package size={36} color="#DDD" /><Text style={s.emptyTxt}>No orders found</Text></View>
              ) : (
                filtered.map((order, i) => {
                  const isOpen = expandedId === order.orderId;
                  const style = sc(order.orderStatus);
                  return (
                    <View key={order.orderId}>
                      <TouchableOpacity
                        style={[s.tr, i % 2 === 1 && s.trAlt]}
                        onPress={() => setExpandedId(isOpen ? null : order.orderId)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.tdId, { flex: 0.7 }]}>#{order.orderId}</Text>
                        <Text style={[s.tdMeta, { flex: 0.8 }]}>{order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.tdAmt}>₹{order.finalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                          <Text style={s.tdSub}>+₹{order.deliveryCost} del.</Text>
                        </View>
                        <View style={{ flex: 1.2 }}>
                          <View style={[s.badge, { backgroundColor: style.bg }]}>
                            <View style={[s.badgeDot, { backgroundColor: style.dot }]} />
                            <Text style={[s.badgeTxt, { color: style.text }]}>{order.orderStatus}</Text>
                          </View>
                        </View>
                        <Text style={[s.tdMeta, { flex: 0.8 }]}>{order.paymentMode || '—'}</Text>
                        <View style={{ flex: 0.3, alignItems: 'center' }}>
                          {isOpen ? <ChevronUp size={13} color="#AAA" /> : <ChevronDown size={13} color="#AAA" />}
                        </View>
                      </TouchableOpacity>

                      {/* Expanded dropdown */}
                      {isOpen && (
                        <View style={s.expand}>
                          {/* Summary row */}
                          <View style={s.expandSummary}>
                            <View style={s.expandStat}>
                              <Text style={s.expandStatLabel}>Sub Total</Text>
                              <Text style={s.expandStatVal}>₹{order.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={s.expandStat}>
                              <Text style={s.expandStatLabel}>Delivery</Text>
                              <Text style={s.expandStatVal}>₹{order.deliveryCost}</Text>
                            </View>
                            <View style={s.expandStat}>
                              <Text style={s.expandStatLabel}>Final</Text>
                              <Text style={[s.expandStatVal, { color: '#F2A20C' }]}>₹{order.finalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={s.expandStat}>
                              <Text style={s.expandStatLabel}>Address</Text>
                              <Text style={[s.expandStatVal, { fontSize: 10 }]} numberOfLines={1}>{order.addressId?.slice(0, 8)}…</Text>
                            </View>
                          </View>

                          {/* Item list */}
                          <Text style={s.itemsHeader}>Order Items</Text>
                          {order.orderItems?.map((item: any, j: number) => (
                            <View key={j} style={s.itemRow}>
                              <View style={s.itemIdx}>
                                <Text style={s.itemIdxTxt}>{j + 1}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={s.itemName}>{item.pname}</Text>
                                <View style={s.itemMeta}>
                                  <Text style={s.itemMetaTxt}>Actual ₹{item.actualPrice}</Text>
                                  {item.discount > 0 && <Text style={s.itemDiscount}>-{item.discount}%</Text>}
                                </View>
                              </View>
                              <Text style={s.itemQty}>×{item.quantity}</Text>
                              <Text style={s.itemTotal}>₹{item.totalPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={s.pagination}>
                <TouchableOpacity style={[s.pageBtn, page === 0 && { opacity: 0.4 }]} disabled={page === 0} onPress={() => setPage(p => p - 1)}>
                  <ChevronLeft size={15} color="#111" /><Text style={s.pageTxt}>Prev</Text>
                </TouchableOpacity>
                <View style={s.pageInfo}><Text style={s.pageInfoTxt}>Page {page + 1} / {totalPages}</Text></View>
                <TouchableOpacity style={[s.pageBtn, page >= totalPages - 1 && { opacity: 0.4 }]} disabled={page >= totalPages - 1} onPress={() => setPage(p => p + 1)}>
                  <Text style={s.pageTxt}>Next</Text><ChevronRight size={15} color="#111" />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* ── Analytics Tab (simplified) ── */
          <>
            {loadingAnalytics ? (
              <View style={s.center}><ActivityIndicator color="#F2A20C" size="large" /></View>
            ) : (
              <>
                {/* Quick Stats */}
                <View style={s.analyticsCard}>
                  <Text style={s.cardTitle}>Summary</Text>
                  <Text style={s.cardSub}>From {orders.length} loaded orders</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
                    {statusDist.map(({ status, count }) => {
                      const st = sc(status);
                      const rev = orders.filter(o => o.orderStatus === status).reduce((sum, o) => sum + (o.finalAmount || 0), 0);
                      return (
                        <View key={status} style={[s.statBox, { borderLeftColor: st.dot }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <View style={[s.smallDot, { backgroundColor: st.dot }]} />
                            <Text style={[s.statStatus, { color: st.text }]}>{status}</Text>
                          </View>
                          <Text style={s.statCount}>{count}</Text>
                          <Text style={s.statCountLabel}>orders</Text>
                          <Text style={s.statRev}>₹{rev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Sales Trend Chart */}
                <View style={s.analyticsCard}>
                  <Text style={s.cardTitle}>Sales Trend</Text>
                  <Text style={s.cardSub}>{salesTrend.length} data points from the order service</Text>
                  <SalesTrendChart data={salesTrend} />
                </View>

                {/* Top Products */}
                <View style={s.analyticsCard}>
                  <Text style={s.cardTitle}>Top Products</Text>
                  <Text style={s.cardSub}>Ranked by units sold</Text>
                  <View style={{ gap: 12, marginTop: 14 }}>
                    {topProducts.slice(0, 6).map((prod, i) => {
                      const maxQ = topProducts[0]?.quantitySold || 1;
                      const pct = Math.round((prod.quantitySold / maxQ) * 100);
                      return (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={[s.rankBadge, i === 0 && { backgroundColor: '#F2A20C' }]}>
                            <Text style={[s.rankNum, i === 0 && { color: '#000' }]}>{i + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.prodName} numberOfLines={1}>{prod.name}</Text>
                            <View style={[s.progressTrack, { marginTop: 5 }]}>
                              <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: i === 0 ? '#F2A20C' : '#1A1A1A' }]} />
                            </View>
                          </View>
                          <Text style={s.prodSold}>{prod.quantitySold} sold</Text>
                        </View>
                      );
                    })}
                    {topProducts.length === 0 && <Text style={s.emptyTxt}>No product data from API</Text>}
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────

const Kpi = ({ icon, label, value, bg }: any) => (
  <View style={[s.kpiCard, { backgroundColor: bg }]}>
    <View style={{ marginBottom: 8 }}>{icon}</View>
    <Text style={s.kpiLabel}>{label}</Text>
    <Text style={s.kpiVal}>{value}</Text>
  </View>
);

const SalesTrendChart = ({ data }: { data: any[] }) => {
  const pts = data.slice(-12);
  const vals = pts.map(p => p.totalSales || p.amount || 0);
  const maxV = Math.max(...vals, 1);
  const CH = 140;

  if (pts.length === 0) return <View style={{ padding: 24, alignItems: 'center' }}><Text style={s.emptyTxt}>No trend data</Text></View>;

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: 44, height: CH, justifyContent: 'space-between', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 6 }}>
          {[maxV, maxV * 0.5, 0].map((v, i) => (
            <Text key={i} style={{ fontSize: 8, color: '#CCC', fontWeight: '700' }}>
              {v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v.toFixed(0)}`}
            </Text>
          ))}
        </View>
        {/* Chart */}
        <View style={{ flex: 1, height: CH, backgroundColor: '#F8F8FA', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          {[0, 50].map(pct => (
            <View key={pct} style={{ position: 'absolute', left: 0, right: 0, top: `${100 - pct}%`, height: 1, backgroundColor: '#EFEFEF' }} />
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingHorizontal: 6, paddingBottom: 4, gap: 4 }}>
            {pts.map((p, i) => {
              const barH = Math.max(4, (vals[i] / maxV) * (CH - 24));
              const isLast = i === pts.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  {vals[i] > 0 && (
                    <Text style={{ fontSize: 7, fontWeight: '800', color: isLast ? '#F2A20C' : '#888', marginBottom: 3 }}>
                      ₹{(vals[i] / 1000).toFixed(1)}k
                    </Text>
                  )}
                  <View style={{ width: 14, height: barH, backgroundColor: isLast ? '#F2A20C' : '#1A1A1A', borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: isLast ? 1 : 0.7 }} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: 44, marginTop: 5, gap: 4 }}>
        {pts.map((p, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 7, color: '#BBB', fontWeight: '700' }}>{fmtDate(p.date)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F6' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 48, paddingBottom: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 11, color: '#BBB', fontWeight: '600', marginTop: 2 },
  hActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 10, backgroundColor: '#F5F5F5', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F2A20C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  exportTxt: { fontSize: 12, fontWeight: '800', color: '#000' },

  mainTabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  mainTabActive: { borderBottomWidth: 2, borderBottomColor: '#F2A20C' },
  mainTabTxt: { fontSize: 13, fontWeight: '700', color: '#AAA' },
  mainTabTxtActive: { color: '#111' },

  scroll: { padding: 16, gap: 14 },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  kpiLabel: { fontSize: 9, fontWeight: '700', color: '#888', marginBottom: 3 },
  kpiVal: { fontSize: 15, fontWeight: '900', color: '#111', letterSpacing: -0.3 },

  chipsScroll: { flexGrow: 0 },
  chipsContent: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF' },
  chipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipTxt: { fontSize: 11, fontWeight: '700', color: '#666' },
  chipTxtActive: { color: '#FFF' },

  tableCard: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#EFEFEF', overflow: 'hidden' },
  thead: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  th: { fontSize: 9, fontWeight: '800', color: '#AAA', letterSpacing: 0.6 },

  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  trAlt: { backgroundColor: '#FAFAFA' },
  tdId: { fontSize: 12, fontWeight: '800', color: '#111' },
  tdAmt: { fontSize: 13, fontWeight: '900', color: '#111' },
  tdSub: { fontSize: 9, fontWeight: '600', color: '#CCC', marginTop: 2 },
  tdMeta: { fontSize: 11, fontWeight: '600', color: '#666' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '800' },

  expand: { backgroundColor: '#FFFBF0', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', borderLeftWidth: 3, borderLeftColor: '#F2A20C', padding: 14, gap: 12 },
  expandSummary: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  expandStat: { minWidth: 80 },
  expandStatLabel: { fontSize: 9, fontWeight: '700', color: '#BBB', marginBottom: 3 },
  expandStatVal: { fontSize: 14, fontWeight: '800', color: '#111' },

  itemsHeader: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 0.8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FFF0D0' },
  itemIdx: { width: 22, height: 22, borderRadius: 6, backgroundColor: '#F2A20C', justifyContent: 'center', alignItems: 'center' },
  itemIdxTxt: { fontSize: 10, fontWeight: '900', color: '#000' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#111' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  itemMetaTxt: { fontSize: 9, color: '#AAA', fontWeight: '600' },
  itemDiscount: { fontSize: 9, fontWeight: '800', color: '#16A34A', backgroundColor: '#F0FDF4', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  itemQty: { fontSize: 12, fontWeight: '700', color: '#888' },
  itemTotal: { fontSize: 13, fontWeight: '900', color: '#111', minWidth: 60, textAlign: 'right' },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  pageTxt: { fontSize: 12, fontWeight: '700', color: '#111' },
  pageInfo: { backgroundColor: '#F2A20C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  pageInfoTxt: { fontSize: 12, fontWeight: '800', color: '#000' },

  // Analytics
  analyticsCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#EFEFEF' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  cardSub: { fontSize: 10, fontWeight: '600', color: '#CCC', marginTop: 3 },
  progressTrack: { height: 6, backgroundColor: '#F5F5F5', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  barLabel: { fontSize: 12, fontWeight: '700', color: '#333' },
  barCount: { fontSize: 11, fontWeight: '700', color: '#888' },
  smallDot: { width: 8, height: 8, borderRadius: 4 },

  statBox: {
    padding: 14,
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    borderLeftWidth: 3,
    minWidth: '47%',
    flex: 1,
  },
  statStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  statCount: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  statCountLabel: { fontSize: 9, fontWeight: '700', color: '#BBB', marginBottom: 4 },
  statRev: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },

  payCard: { flex: 1, backgroundColor: '#F8F8FA', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  payMode: { fontSize: 11, fontWeight: '800', color: '#111' },
  payPct: { fontSize: 22, fontWeight: '900', color: '#F2A20C' },
  payCount: { fontSize: 10, fontWeight: '600', color: '#AAA' },
  payBar: { width: '100%', height: 40, backgroundColor: '#EEE', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', marginTop: 8 },
  payBarFill: { width: '100%', backgroundColor: '#F2A20C', borderRadius: 6 },

  rankBadge: { width: 24, height: 24, borderRadius: 7, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 11, fontWeight: '900', color: '#888' },
  prodName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#111' },
  prodSold: { fontSize: 11, fontWeight: '700', color: '#888' },

  center: { alignItems: 'center', padding: 48, gap: 12 },
  loadTxt: { fontSize: 11, fontWeight: '700', color: '#CCC' },
  emptyTxt: { fontSize: 12, fontWeight: '700', color: '#CCC', textAlign: 'center' },
});
