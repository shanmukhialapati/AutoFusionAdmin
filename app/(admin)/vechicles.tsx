import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Platform, Alert
} from 'react-native';

const api = 'http://192.168.0.54:8081';

export default function VehiclesScreen() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const { width } = useWindowDimensions();
    const numColumns = width > 1200 ? 4 : width > 900 ? 3 : width > 600 ? 2 : 1;

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const session = await AsyncStorage.getItem('user_session');
            const token = JSON.parse(session).token;
            const res = await axios.get(`${api}/api/vehicles/admin/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVehicles(res.data || []);
        } catch (e) {
            console.error('Vehicles fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const session = await AsyncStorage.getItem('user_session');
            const token = JSON.parse(session).token;
            await axios.patch(`${api}/api/vehicles/${id}/toggle-status`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVehicles(prev => {
                return prev.map(v => {
                    if (v.id === id) {
                        return { ...v, isActive: !v.isActive };
                    } else {
                        return v;
                    }
                });
            });
        } catch (e) {
            console.error('Toggle failed', e);
        }
    };

    const deleteVehicle = async (id: number) => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')
            : await new Promise(resolve =>
                Alert.alert(
                    'Confirm Delete',
                    'Are you sure you want to delete this vehicle?',
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
            await axios.delete(`${api}/api/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVehicles(prev => prev.filter(v => v.id !== id));
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;

            if (status === 400 && msg) {
                if (Platform.OS === 'web') {
                    window.alert(`⚠️ Cannot Delete\n\n${msg}`);
                } else {
                    Alert.alert(
                        '⚠️ Cannot Delete',
                        msg,
                        [{ text: 'OK', style: 'default' }]
                    );
                }
            } else {
                if (Platform.OS === 'web') {
                    window.alert('Could not delete vehicle. Please try again.');
                } else {
                    Alert.alert('Error', 'Could not delete vehicle. Please try again.');
                }
            }
            console.error('Delete failed', e);
        }
    };
    const filtered = vehicles.filter(v => {
        if (activeTab === 'active') return v.isActive;
        if (activeTab === 'inactive') return !v.isActive;
        return true;
    });

    const renderCard = ({ item }) => (
        <View style={{ width: `${100 / numColumns}%`, padding: 6 }}>
            <View style={[styles.card, !item.isActive && styles.inactiveCard]}>

                {/* Brand + Model + Year */}
                <View style={styles.vehicleIconRow}>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleName} numberOfLines={1}>
                            {item.brand} {item.model}
                        </Text>
                        <Text style={styles.vehicleYear}>{item.year}</Text>
                    </View>
                    <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={[styles.badgeText, item.isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>

                {/* Specs */}
                <View style={styles.specsRow}>
                    <View style={styles.specChip}>
                        <Text style={styles.specText}>{item.fuelType}</Text>
                    </View>
                    <View style={styles.specChip}>
                        <Text style={styles.specText}>{item.transmission}</Text>
                    </View>
                    {item.power && (
                        <View style={styles.specChip}>
                            <Text style={styles.specText}>{item.power} HP</Text>
                        </View>
                    )}
                </View>

                {/* Engine */}
                {item.engine && (
                    <Text style={styles.engineText} numberOfLines={1}>{item.engine}</Text>
                )}

                {/* Actions */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.editBtn, !item.isActive && { opacity: 0.4 }]}
                        disabled={!item.isActive}
                        onPress={() =>
                            router.push(`/editvehicle?id=${item.id}`)
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
                        style={styles.deleteBtn}
                        onPress={() => deleteVehicle(item.id)}
                    >
                        <Trash2 size={20} color="#970808ff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={22} color="#111111" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.pageTitle}>Vehicles</Text>
                            <Text style={styles.pageSubtitle}>{vehicles.length} total vehicles</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/addvehicle')}
                    >
                        <Text style={styles.addBtnText}>+ Add Vehicle</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={[styles.statValue, { color: '#F2A20C' }]}>{vehicles.length}</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: '#111111', borderWidth: 1.5 }]}>
                        <Text style={styles.statLabel}>Active</Text>
                        <Text style={[styles.statValue, { color: '#111111' }]}>
                            {vehicles.filter(v => v.isActive).length}
                        </Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: '#F2A20C', borderWidth: 1.5 }]}>
                        <Text style={styles.statLabel}>Inactive</Text>
                        <Text style={[styles.statValue, { color: '#F2A20C' }]}>
                            {vehicles.filter(v => !v.isActive).length}
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

                {/* List */}
                {loading ? (
                    <ActivityIndicator color="#F2A20C" size="large" style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No vehicles found</Text>
                    </View>
                ) : (
                    <FlatList
                        key={numColumns}
                        data={filtered}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderCard}
                        numColumns={numColumns}
                        columnWrapperStyle={numColumns > 1 ? { justifyContent: 'flex-start' } : undefined}
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        padding: 14,
    },
    inactiveCard: { opacity: 0.6 },

    vehicleIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },

    vehicleName: { fontSize: 14, fontWeight: '700', color: '#111111' },
    vehicleYear: { fontSize: 12, color: '#888888', marginTop: 2 },

    specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    specChip: {
        backgroundColor: '#F7F7F7',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    specText: { fontSize: 11, fontWeight: '600', color: '#555555' },

    engineText: { fontSize: 11, color: '#AAAAAA', marginBottom: 12 },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    activeBadge: { backgroundColor: '#EAF3DE' },
    inactiveBadge: { backgroundColor: '#FCEBEB' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    activeBadgeText: { color: '#27500A' },
    inactiveBadgeText: { color: '#791F1F' },

    cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    editBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#111111',
        borderRadius: 8,
        paddingVertical: 7,
        alignItems: 'center',
    },
    editBtnText: { fontSize: 12, fontWeight: '800', color: '#111111' },
    toggleBtn: {
        flex: 2,
        borderRadius: 8,
        paddingVertical: 7,
        alignItems: 'center',
        backgroundColor: '#F2A20C',
    },
    toggleBtnText: { fontSize: 11, fontWeight: '900', color: '#111111' },
    deleteBtn: {
        backgroundColor: '#FCEBEB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#791F1F' },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#AAAAAA', fontSize: 14, fontWeight: '600' },
});