import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../axios/axiosInstance';
import { useRouter } from 'expo-router';
import { ArrowRight, Clock, LayoutGrid, Package, RefreshCw, Shield, Target, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState({ totalOrders: 0, todaySales: 0, monthlySales: 0, yearlySales: 0 });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [identityStats, setIdentityStats] = useState({ users: 0, admins: 0 });
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => { initDashboard(); }, []);

  const initDashboard = async () => {
    try {
      setLoading(true);
      const storedSession = await AsyncStorage.getItem('user_session');
      if (!storedSession) return;
      setSession(JSON.parse(storedSession));

      const [summaryRes, auditsRes, usersRes, adminsRes, trendRes, productsRes, categoriesRes] = await Promise.all([
        axiosInstance.get('/orders/dashboard/summary'),
        axiosInstance.get('/admin/audit/logins?page=0&size=20'),
        axiosInstance.get('/users/all'),
        axiosInstance.get('/admin/all'),
        axiosInstance.get('/orders/dashboard/sales-trend'),
        axiosInstance.get('/orders/dashboard/top-products'),
        axiosInstance.get('/products/top-categories'),
      ]);

      setTopCategories(categoriesRes.data.data || categoriesRes.data?.content || categoriesRes.data || []);

      const trendData = trendRes.data.data || trendRes.data?.content || trendRes.data || [];
      const trend = [...trendData].sort((a: any, b: any) => 
        new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
      );
      setSalesTrend(trend);
      setTopProducts(productsRes.data.data || productsRes.data?.content || productsRes.data || []);
      
      const audits = auditsRes.data.data || auditsRes.data?.content || auditsRes.data || [];
      setRecentAudits(Array.isArray(audits) ? audits : []);

      const uList = usersRes.data.data || (Array.isArray(usersRes.data) ? usersRes.data : []);
      const aList = adminsRes.data.data || (Array.isArray(adminsRes.data) ? adminsRes.data : []);
      setIdentityStats({
        users: uList.length || 0,
        admins: aList.length || 0,
      });

      const today = new Date().toISOString().split('T')[0];
      const todayFromTrend = trend
        .filter((p: any) => (p.date || '').startsWith(today))
        .reduce((sum: number, p: any) => sum + (p.totalSales || p.amount || 0), 0);

      const sumData = summaryRes.data.data || summaryRes.data || {};
      setSummary({
        ...sumData,
        todaySales: sumData.todaySales || todayFromTrend,
      });
    } catch (e) {
      console.error('Dashboard Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const todaySales = summary.todaySales || 0;
  const monthlySales = summary.monthlySales || 0;

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerAccent} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.userName}>Hello, {session?.username || 'Admin'}</Text>
            <Text style={styles.userRole}>Welcome back</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={initDashboard} disabled={loading}>
            <RefreshCw size={18} color="#F2A20C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* KPI Row */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
          <KpiCard icon={<Users size={18} color="#D97706" />} label="Users" value={identityStats.users} bg="#FFF" accent="#F2A20C" />
          <KpiCard icon={<Shield size={18} color="#000" />} label="Admins" value={identityStats.admins} bg="#FFF" accent="#000" />
          <KpiCard icon={<Target size={18} color="#D97706" />} label="Orders" value={summary.totalOrders} bg="#FFF" accent="#F2A20C" />
          <KpiCard icon={<TrendingUp size={18} color="#F2A20C" />} label="Revenue" value={`₹${todaySales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} bg="#1A1A2E" accent="#F2A20C" textColor="#F2A20C" dark />
        </Animated.View>

        {/* Sales + Top Products */}
        <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
          <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, { flex: 1.6, borderTopWidth: 3, borderTopColor: '#F2A20C' }]}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Sales Overview</Text>
                <Text style={styles.cardSub}>Revenue trend</Text>
              </View>
              <View style={styles.badge}>
                <Clock size={10} color="#AAA" />
                <Text style={styles.badgeText}>Recent</Text>
              </View>
            </View>
            <SalesChart data={salesTrend} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>TODAY</Text>
                <Text style={styles.summaryAmt}>₹{todaySales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>MONTHLY</Text>
                <Text style={styles.summaryAmt}>₹{monthlySales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={[styles.card, { flex: 1, borderTopWidth: 3, borderTopColor: '#3B82F6' }]}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Top Products</Text>
                <Text style={styles.cardSub}>By sales volume</Text>
              </View>
              <Package size={15} color="#CCC" />
            </View>
            <View style={{ gap: 14 }}>
              {topProducts.slice(0, 4).map((prod, i) => (
                <View key={i} style={styles.prodRow}>
                  <View style={[styles.prodRank, { backgroundColor: i === 0 ? '#F2A20C' : '#F5F5F5' }]}>
                    <Text style={[styles.prodRankNum, { color: i === 0 ? '#000' : '#999' }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                    <View style={styles.prodTrack}>
                      <View style={[styles.prodFill, {
                        width: `${Math.min(100, (prod.quantitySold / (topProducts[0]?.quantitySold || 1)) * 100)}%`,
                        backgroundColor: i % 2 === 0 ? '#F2A20C' : '#1A1A2E'
                      }]} />
                    </View>
                  </View>
                  <Text style={styles.prodSold}>{prod.quantitySold}</Text>
                </View>
              ))}
              {topProducts.length === 0 && !loading && <Text style={styles.empty}>No data yet</Text>}
              {loading && <ActivityIndicator color="#F2A20C" style={{ padding: 16 }} />}
            </View>
          </Animated.View>
        </View>

        {/* Audit */}
        <View style={isMobile ? { flexDirection: 'column' } : { flex: 1 }}>

          <Animated.View entering={FadeInUp.delay(500)} style={[styles.card, { borderTopWidth: 3, borderTopColor: '#10B981' }]}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Audit History</Text>
                <Text style={styles.cardSub}>Access logs</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(admin)/audit')}>
                <ArrowRight size={15} color="#CCC" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.auditScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {loading
                ? <ActivityIndicator color="#F2A20C" style={{ padding: 16 }} />
                : recentAudits.map((log, i) => <AuditRow key={i} log={log} />)
              }
              {recentAudits.length === 0 && !loading && <Text style={styles.empty}>No activity</Text>}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Category Performance */}
        <Animated.View entering={FadeInUp.delay(600)} style={[styles.card, { borderTopWidth: 3, borderTopColor: '#F59E0B' }]}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardTitle}>Sales by Category</Text>
              <Text style={styles.cardSub}>Units sold per category</Text>
            </View>
            <LayoutGrid size={15} color="#F59E0B" />
          </View>
          <CategoryPerformance data={topCategories} />
        </Animated.View>


      </ScrollView>
    </View>
  );
}

// ─── KPI Card ────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, bg, accent, textColor, dark }: any) => (
  <View style={[styles.kpiCard, { backgroundColor: bg, borderColor: accent, borderLeftWidth: 4 }]}>
    <View style={[styles.kpiIconWrap, dark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>{icon}</View>
    <Text style={[styles.kpiLabel, dark && { color: 'rgba(255,255,255,0.5)' }]}>{label}</Text>
    <Text style={[styles.kpiValue, { color: textColor || '#111' }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
  </View>
);

// ─── Sales Chart ─────────────────────────────────────────────
const fmtLabel = (d: string) => {
  try {
    const dt = new Date(d);
    const now = new Date();
    const isToday = dt.toDateString() === now.toDateString();
    
    // Example: 7:09 PM
    const timeStr = dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    if (!isToday) {
      const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStr}\n${timeStr}`;
    }
    return timeStr;
  } catch {
    return '---';
  }
};

const CHART_H = 150;

const SalesChart = ({ data }: { data: any[] }) => {
  const pts = data.slice(-10);
  const vals = pts.map(p => p.totalSales || p.amount || 0);
  const maxV = Math.max(...vals, 1);

  const fmtY = (v: number) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v.toFixed(0)}`;

  if (pts.length === 0) {
    return (
      <View style={{ height: CHART_H + 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#DDD', fontSize: 12, fontWeight: '700' }}>No sales data yet</Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: 40, height: CHART_H, justifyContent: 'space-between', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 6 }}>
          {[maxV, maxV * 0.5, 0].map((v, i) => (
            <Text key={i} style={{ fontSize: 8, color: '#CCC', fontWeight: '700' }}>{fmtY(v)}</Text>
          ))}
        </View>

        {/* Chart body */}
        <View style={{ flex: 1, height: CHART_H, backgroundColor: '#F8F8FA', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          {/* Grid lines at 0%, 50%, 100% */}
          {[0, 50].map(pct => (
            <View key={pct} style={{
              position: 'absolute', left: 0, right: 0,
              top: `${100 - pct}%`,
              height: 1, backgroundColor: '#EFEFEF',
            }} />
          ))}

          {/* Bars row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingHorizontal: 8, paddingBottom: 4, gap: 6 }}>
            {pts.map((p, i) => {
              const barH = Math.max(6, (vals[i] / maxV) * (CHART_H - 28));
              const colors = ['#F2A20C', '#1A1A2E', '#D97706', '#000', '#B45309', '#4B5563'];
              const barColor = colors[i % colors.length];
              
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  {vals[i] > 0 && (
                    <View style={{
                      backgroundColor: barColor,
                      paddingHorizontal: 4, paddingVertical: 2,
                      borderRadius: 4, marginBottom: 4,
                    }}>
                      <Text style={{ fontSize: 7, fontWeight: '900', color: barColor === '#1A1A1A' || barColor === '#3B82F6' || barColor === '#8B5CF6' ? '#FFF' : '#000' }}>
                        {`₹${(vals[i] / 1000).toFixed(1)}k`}
                      </Text>
                    </View>
                  )}
                  <View style={{
                    width: 20,
                    height: barH,
                    backgroundColor: barColor,
                    borderTopLeftRadius: 5,
                    borderTopRightRadius: 5,
                    opacity: 0.85,
                  }} />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis time labels */}
      <View style={{ flexDirection: 'row', paddingLeft: 40, marginTop: 6, paddingHorizontal: 8, gap: 6 }}>
        {pts.map((p, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: '#BBB', fontWeight: '700' }}>{fmtLabel(p.date)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Audit Row ───────────────────────────────────────────────
const ACTION_MAP: Record<string, { label: string; bg: string; color: string }> = {
  LOGIN_SUCCESS: { label: 'Login', bg: '#F0FDF4', color: '#16A34A' },
  LOGOUT: { label: 'Logout', bg: '#FFFBEB', color: '#D97706' },
  LOGIN_FAILED: { label: 'Failed', bg: '#FEF2F2', color: '#DC2626' },
};

const AuditRow = ({ log }: { log: any }) => {
  const action = log.action || log.event || 'UNKNOWN';
  const cfg = ACTION_MAP[action] || { label: action.slice(0, 10), bg: '#F5F5F5', color: '#888' };
  const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <View style={styles.auditRow}>
      <View style={[styles.auditDot, { backgroundColor: cfg.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.auditUser} numberOfLines={1}>{log.username || log.userId || 'Unknown'}</Text>
        <View style={[styles.auditBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.auditBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={styles.auditTime}>{time}</Text>
    </View>
  );
};

// ─── Category Performance ────────────────────────────────────
const CategoryPerformance = ({ data }: { data: any[] }) => {
  const maxSold = Math.max(...data.map(d => d.totalSold), 1);
  return (
    <View style={{ gap: 16 }}>
      {data.map((item, i) => (
        <View key={i} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#111', textTransform: 'capitalize' }}>{item.category}</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#111' }}>{item.totalSold}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <LinearGradient
              colors={i % 2 === 0 ? ['#F2A20C', '#D97706'] : ['#1A1A2E', '#2D3748']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${(item.totalSold / maxSold) * 100}%`,
                borderRadius: 4
              }}
            />
          </View>
        </View>
      ))}
      {data.length === 0 && <Text style={styles.empty}>No category data</Text>}
    </View>
  );
};



// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  topHeader: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EFEFEF',
  },
  headerAccent: {
    height: 4,
    backgroundColor: '#F2A20C',
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingTop: 48, paddingBottom: 16,
  },
  userName: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  userRole: { fontSize: 11, fontWeight: '600', color: '#BBB', marginTop: 2 },
  refreshBtn: { padding: 10, backgroundColor: '#1A1A2E', borderRadius: 14, borderWidth: 1, borderColor: '#F2A20C33' },
  scrollContent: { padding: 24, gap: 20 },

  // KPI — now full-color cards
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    flex: 1, minWidth: 100, borderRadius: 20,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#EEE',
  },
  kpiIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginBottom: 4, letterSpacing: 0.3 },
  kpiValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

  // Layout
  row: { flexDirection: 'row', gap: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#EFEFEF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  cardSub: { fontSize: 10, fontWeight: '600', color: '#CCC', marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#AAA' },

  // Chart
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 8, marginBottom: 16 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 },
  barVal: { fontSize: 8, fontWeight: '700', color: '#AAA' },
  bar: { width: '100%' },
  barLabel: { fontSize: 7, color: '#CCC', fontWeight: '700', textAlign: 'center' },

  // Summary
  summaryRow: { flexDirection: 'row', backgroundColor: '#F8F8FA', borderRadius: 16, padding: 14 },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: '#BBB', marginBottom: 4, letterSpacing: 1 },
  summaryAmt: { fontSize: 18, fontWeight: '900', color: '#111' },
  summaryDiv: { width: 1, backgroundColor: '#EBEBEB' },

  // Products
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prodRank: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  prodRankNum: { fontSize: 11, fontWeight: '900' },
  prodName: { fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 5 },
  prodTrack: { height: 4, backgroundColor: '#F5F5F5', borderRadius: 2, overflow: 'hidden' },
  prodFill: { height: '100%', borderRadius: 2 },
  prodSold: { fontSize: 11, fontWeight: '800', color: '#999', minWidth: 28, textAlign: 'right' },

  // Audit
  auditScroll: { maxHeight: 220 },
  auditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  auditDot: { width: 7, height: 7, borderRadius: 4 },
  auditUser: { fontSize: 11, fontWeight: '700', color: '#111', marginBottom: 2 },
  auditBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' },
  auditBadgeText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  auditTime: { fontSize: 9, fontWeight: '700', color: '#CCC' },


  empty: { textAlign: 'center', color: '#CCC', padding: 20, fontSize: 11, fontWeight: '700' },
});
