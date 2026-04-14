import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,

  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Shield,
  CheckCircle2,
  XCircle,
  LogOut,
  Activity,
  User as UserIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,

  Lock,
  Zap
} from 'lucide-react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';


const COLORS = {
  bg: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textMuted: '#4B5563',
  textDim: '#9CA3AF',
  border: '#E5E7EB',
  rowBorder: '#F3F4F6',
  amber: '#F2A20C',
  amberDim: '#FEF3C7',
  success: '#16A34A',
  successDim: '#DCFCE7',
  danger: '#DC2626',
  dangerDim: '#FEE2E2',
};

import axiosInstance from '../../axios/axiosInstance';

const AVAILABLE_ACTIONS = [
  'ALL',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT'
];

const AVAILABLE_ENTITIES = [
  'ALL',
  'ADMIN',
  'USER'
];


interface AuditLog {
  id: number;
  action: string;
  details: string;
  entityId: string;
  entityType: string;
  role: string;
  timestamp: string;
  userId: string | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [showActionFilter, setShowActionFilter] = useState(false);
  const [showEntityFilter, setShowEntityFilter] = useState(false);

  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const fetchLogs = useCallback(async (
    pageNum: number,
    isRefresh = false,
    action = selectedAction,
    entity = selectedEntity,
    query = searchText
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let url = `/admin/audit/logins?page=${pageNum}&size=50`;

      if (action !== 'ALL') {
        url += `&action=${action}&type=${action}&actionType=${action}&status=${action}`;
      }
      if (entity !== 'ALL') {
        url += `&role=${entity}&entityType=${entity}&entityRole=${entity}`;
      }
      if (query.trim()) {
        const q = encodeURIComponent(query.trim());
        url += `&search=${q}&query=${q}&q=${q}`;
      }

      const response = await axiosInstance.get(url);
      const { data, content, last, totalPages: total, totalElements: count } = response.data;

      const newLogs = data || content || [];
      setLogs(newLogs);
      setIsLastPage(last);
      setTotalPages(total || 0);
      setTotalElements(count || newLogs.length);
      setPage(pageNum);

      // DEEP SCAN: If we filtered but got 0 results on Page 0, try fetching Page 1 & 2 automatically
      if (pageNum === 0 && !last && (action !== 'ALL' || entity !== 'ALL' || query.trim())) {
        const matchFound = newLogs.some((l: any) => {
          const mAction = action === 'ALL' || l.action === action;
          const mEntity = entity === 'ALL' || (l.role || '').toUpperCase() === entity;
          const mText = !query.trim() || JSON.stringify(l).toLowerCase().includes(query.toLowerCase());
          return mAction && mEntity && mText;
        });

        if (!matchFound) {
          // Attempt a background scan of page 1
          const nextResp = await axiosInstance.get(url.replace('page=0', 'page=1'));
          const nextData = nextResp.data.data || nextResp.data.content || [];
          if (nextData.length > 0) {
            setLogs(prev => [...prev, ...nextData]);
            setIsLastPage(nextResp.data.last);
          }
        }
      }

    } catch (error) {
      console.error('Audit logs fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAction, selectedEntity, searchText]);

  useEffect(() => {
    fetchLogs(0);
  }, []);

  // Global Sync Search: Debounce the search input to trigger a global fetch
  useEffect(() => {
    if (!searchText && selectedAction === 'ALL' && selectedEntity === 'ALL') return;

    const timer = setTimeout(() => {
      fetchLogs(0, false, selectedAction, selectedEntity, searchText);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchText]);

  const onRefresh = () => {
    fetchLogs(0, true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!isLastPage || newPage < page)) {
      fetchLogs(newPage);
    }
  };


  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchEntity = selectedEntity === 'ALL' || (log.role || '').toUpperCase() === selectedEntity;
      const matchText = !searchText.trim() ||
        (log.userId?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (log.details?.toLowerCase() || '').includes(searchText.toLowerCase());

      return matchAction && matchEntity && matchText;
    });
  }, [logs, selectedAction, selectedEntity, searchText]);

  const truncateId = (id: string | null) => {
    if (!id) return 'SYSTEM';
    if (id.length <= 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { color: COLORS.success, bg: COLORS.successDim, label: 'Login Success' };
      case 'LOGOUT':
        return { color: COLORS.amber, bg: COLORS.amberDim, label: 'Logged Out' };
      case 'LOGIN_FAILED':
        return { color: COLORS.danger, bg: COLORS.dangerDim, label: 'Login Failed' };
      case 'CREATE_ADMIN':
        return { color: COLORS.amber, bg: COLORS.amberDim, label: 'Admin Created' };
      default:
        return { color: COLORS.textMuted, bg: COLORS.surface, label: action };
    }
  };

  const renderLogItem = ({ item, index }: { item: AuditLog; index: number }) => {
    const config = getActionConfig(item.action);
    const { date, time } = formatDate(item.timestamp);

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 10).duration(200)}
        style={styles.tableRow}
      >
        <View style={[styles.column, styles.userCol]}>
          <View style={styles.avatarContainer}>
            <UserIcon size={14} color={COLORS.amber} />
          </View>
          <Text style={styles.rowTitle}>{truncateId(item.userId)}</Text>
        </View>

        <View style={[styles.column, styles.actionCol]}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={[styles.column, styles.dateTimeCol]}>
          <View>
            <Text style={styles.rowTitle}>{date}</Text>
            <Text style={styles.rowSubtitle}>{time}</Text>
          </View>
        </View>

        <View style={[styles.column, styles.subjectCol]}>
          <Text style={styles.detailsText} numberOfLines={1}>
            {item.details || `${item.entityType || 'CORE'} Interaction`}
          </Text>
        </View>

        <View style={[styles.column, styles.entityCol]}>
          <View style={styles.entityTag}>
            <Text style={styles.entityTagText}>{item.role || 'Admin'}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, styles.userCol, { color: '#000' }]}>User ID</Text>
      <Text style={[styles.headerText, styles.actionCol, { color: '#000' }]}>Status</Text>
      <Text style={[styles.headerText, styles.dateTimeCol, { color: '#000' }]}>Datetime</Text>
      <Text style={[styles.headerText, styles.subjectCol, { color: '#000' }]}>Details</Text>
      <Text style={[styles.headerText, styles.entityCol, { color: '#000' }]}>Entity</Text>
    </View>
  );

  const PaginationSection = () => (
    <View style={styles.paginationWrapper}>
      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>PAGE </Text>
        <View style={styles.pageNumberBox}>
          <Text style={styles.pageNumberText}>{page + 1}</Text>
        </View>
        <Text style={styles.paginationText}> OF {totalPages || 1}</Text>
      </View>
      <View style={styles.paginationControls}>
        <TouchableOpacity
          style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
          onPress={() => handlePageChange(page - 1)}
          disabled={page === 0}
        >
          <ChevronLeft size={18} color={page === 0 ? COLORS.textDim : COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pageBtn, isLastPage && styles.pageBtnDisabled]}
          onPress={() => handlePageChange(page + 1)}
          disabled={isLastPage}
        >
          <ChevronRight size={18} color={isLastPage ? COLORS.textDim : COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const FilterPicker = ({ label, value, options, visible, onToggle, onSelect }: any) => (
    <View style={styles.filterGroup}>
      <TouchableOpacity style={styles.filterButton} onPress={onToggle}>
        <Text style={styles.filterLabel}>{label}: </Text>
        <Text style={styles.filterValue}>{value}</Text>
        <ChevronDown size={14} color={COLORS.textDim} style={{ marginLeft: 8, transform: [{ rotate: visible ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      {visible && (
        <View style={styles.dropdownOverlay}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownItem, value === opt && { backgroundColor: COLORS.amberDim }]}
              onPress={() => {
                onSelect(opt);
                onToggle();
              }}
            >
              <Text style={[styles.dropdownItemText, value === opt && { color: COLORS.amber, fontWeight: '800' }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={!isWeb}
        contentContainerStyle={{ flex: isWeb ? 1 : undefined }}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, !isWeb && { width: 1100 }]}>

          <View style={[styles.header, { zIndex: 1000 }]}>
            <View>
              <Text style={styles.title}>Audit Logs</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>
                  {(selectedAction !== 'ALL' || selectedEntity !== 'ALL' || searchText)
                    ? `${filteredLogs.length} Matches Found`
                    : `${totalElements.toLocaleString()} Total Records`}
                </Text>
                {(selectedAction !== 'ALL' || selectedEntity !== 'ALL' || searchText) && (
                  <View style={styles.activeFilterBadge}>
                    <Activity size={10} color={COLORS.amber} />
                    <Text style={styles.activeFilterText}>
                      ACTIVE: {selectedEntity !== 'ALL' ? selectedEntity : ''} {selectedAction !== 'ALL' ? `+ ${selectedAction}` : ''} {searchText ? `+ "${searchText}"` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <FilterPicker
                label="ACTION"
                value={selectedAction}
                options={AVAILABLE_ACTIONS}
                visible={showActionFilter}
                onToggle={() => {
                  setShowActionFilter(!showActionFilter);
                  setShowEntityFilter(false);
                }}
                onSelect={(val: string) => {
                  setSelectedAction(val);
                  setShowActionFilter(false);
                  fetchLogs(0, false, val, selectedEntity, searchText);
                }}
              />
              <FilterPicker
                label="ENTITY"
                value={selectedEntity}
                options={AVAILABLE_ENTITIES}
                visible={showEntityFilter}
                onToggle={() => {
                  setShowEntityFilter(!showEntityFilter);
                  setShowActionFilter(false);
                }}
                onSelect={(val: string) => {
                  setSelectedEntity(val);
                  setShowEntityFilter(false);
                  fetchLogs(0, false, selectedAction, val, searchText);
                }}
              />
              <View style={styles.searchContainer}>
                <Search size={16} color={COLORS.textDim} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ID / Action / Details..."
                  placeholderTextColor={COLORS.textDim}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>
          </View>

          <View style={styles.tableSurface}>
            {loading && !refreshing ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.amber} />
                <Text style={styles.loadingText}>Loading logs...</Text>
              </View>
            ) : (
              <>
                <TableHeader />
                <FlatList
                  data={filteredLogs}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderLogItem}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />
                  }
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Activity size={32} color={COLORS.textDim} />
                      <Text style={styles.emptyText}>No matches found</Text>
                    </View>
                  }
                />
                <PaginationSection />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mainWrapper: {
    flex: 1,
    padding: 64,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1000,
    position: 'relative',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterGroup: {
    position: 'relative',
    zIndex: 1100,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    minWidth: 140,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDim,
    letterSpacing: 0.5,
  },
  filterValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    zIndex: 2000,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }
    }),
  },
  dropdownItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    width: 220,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }),
  } as any,
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '500',
    marginTop: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.amberDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(242, 162, 12, 0.2)',
  },
  activeFilterText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.amber,
    letterSpacing: 0.5,
  },
  tableSurface: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 400,
    zIndex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.amber,
  },
  headerText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rowBorder,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCol: { width: 150 },
  actionCol: { width: 120 },
  dateTimeCol: { width: 140 },
  subjectCol: { width: 300 },
  entityCol: { width: 100, justifyContent: 'flex-end' },

  avatarContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.amberDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: 9,
    color: COLORS.textDim,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  entityTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entityTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 20,
    backgroundColor: COLORS.surface,
  },
  paginationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDim,
  },
  pageNumberBox: {
    backgroundColor: COLORS.text,
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageNumberText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: '900',
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 8,
  },
  pageBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  listContent: {
    paddingBottom: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 2,
  },
  emptyContainer: {
    padding: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textDim,
    fontWeight: '600',
    textAlign: 'center',
  },
});
