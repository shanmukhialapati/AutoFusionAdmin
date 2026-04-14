import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Search, X, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

import axiosInstance from '@/axios/axiosInstance';

const CATEGORY_META = {
    oil: { icon: '🛢', label: 'Oils & Fluids', color: '#F2A20C' },
    engine: { icon: '⚙️', label: 'Engine', color: '#111111' },
    brake: { icon: '🔴', label: 'Brakes', color: '#791F1F' },
    filter: { icon: '🌀', label: 'Filters', color: '#444444' },
    other: { icon: '🔧', label: 'Other', color: '#888888' },
};

const MOCK_PARTS = {
    'Toyota_Camry_2023': [
        { id: 1, name: 'Premium Engine Oil 5W-30', company: 'Shell', category: 'oil', partNumber: 'SHL-5W30-001', actualPrice: 1299, discount: 10, stockQuantity: 150, description: 'Full synthetic, 5000km drain interval', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'Disc', brakeSystem: 'ABS with EBD', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic' } },
        { id: 2, name: 'OEM Air Filter', company: 'Toyota Genuine', category: 'filter', partNumber: 'TYT-AF-CAM23', actualPrice: 849, discount: 0, stockQuantity: 80, description: 'OEM replacement air filter for 2.5L', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'N/A', brakeSystem: 'N/A', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic' } },
        { id: 3, name: 'Front Brake Pads Set', company: 'Brembo', category: 'brake', partNumber: 'BRM-FBP-CAM', actualPrice: 3499, discount: 15, stockQuantity: 40, description: 'High performance ceramic front brake pads', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'Disc', brakeSystem: 'ABS with EBD + VSC', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic' } },
        { id: 4, name: 'Spark Plug Set x4', company: 'NGK', category: 'engine', partNumber: 'NGK-ILFR6T11', actualPrice: 1599, discount: 5, stockQuantity: 200, description: 'Iridium IX spark plugs for max efficiency', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'Disc', brakeSystem: 'ABS', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic' } },
        { id: 5, name: 'Cabin Air Filter', company: 'Bosch', category: 'filter', partNumber: 'BSH-CF-CAM23', actualPrice: 499, discount: 0, stockQuantity: 120, description: 'Activated charcoal cabin air filter', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'Disc', brakeSystem: 'ABS', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic CVT' } },
        { id: 6, name: 'Timing Belt Kit', company: 'Gates', category: 'engine', partNumber: 'GTB-TBK-2AR', actualPrice: 5999, discount: 8, stockQuantity: 25, description: 'Complete timing belt kit with tensioner', specs: { engineType: 'Inline-4', engineLiters: '2.5L', engineCodes: '2AR-FE', enginePower: '208 HP', brakeType: 'Disc', brakeSystem: 'ABS with EBD', volumeOfCcm: '2494 cc', tank: '70L', abs: true, configurationAxis: 'FWD', transmissionType: 'Automatic' } },
    ],
    'Honda_Civic_2022': [
        { id: 7, name: 'Engine Oil 0W-20', company: 'Mobil 1', category: 'oil', partNumber: 'MB1-0W20-CIV', actualPrice: 1499, discount: 12, stockQuantity: 180, description: 'Ultra-low viscosity full synthetic oil', specs: { engineType: 'Inline-4 Turbo', engineLiters: '1.5L', engineCodes: 'L15B7', enginePower: '174 HP', brakeType: 'Disc', brakeSystem: 'VSA', volumeOfCcm: '1498 cc', tank: '47L', abs: true, configurationAxis: 'FWD', transmissionType: 'CVT' } },
        { id: 8, name: 'Rear Brake Rotors Pair', company: 'DBA', category: 'brake', partNumber: 'DBA-RBR-CIV22', actualPrice: 4299, discount: 0, stockQuantity: 30, description: 'Slotted performance rear rotors', specs: { engineType: 'Inline-4 Turbo', engineLiters: '1.5L', engineCodes: 'L15B7', enginePower: '174 HP', brakeType: 'Disc', brakeSystem: 'VSA', volumeOfCcm: '1498 cc', tank: '47L', abs: true, configurationAxis: 'FWD', transmissionType: 'CVT' } },
        { id: 9, name: 'OEM Oil Filter', company: 'Honda Genuine', category: 'filter', partNumber: 'HON-OF-L15B7', actualPrice: 299, discount: 0, stockQuantity: 300, description: 'OEM oil filter for 1.5T engine', specs: { engineType: 'Inline-4 Turbo', engineLiters: '1.5L', engineCodes: 'L15B7', enginePower: '174 HP', brakeType: 'Disc', brakeSystem: 'VSA', volumeOfCcm: '1498 cc', tank: '47L', abs: true, configurationAxis: 'FWD', transmissionType: 'CVT' } },
    ],
    'BMW_3 Series_2023': [
        { id: 10, name: 'BMW LL-04 Engine Oil', company: 'Castrol', category: 'oil', partNumber: 'CST-LL04-5W30', actualPrice: 2799, discount: 5, stockQuantity: 90, description: 'Longlife-04 approved for BMW B48', specs: { engineType: 'Inline-4 Turbo', engineLiters: '2.0L', engineCodes: 'B48B20', enginePower: '255 HP', brakeType: 'Disc', brakeSystem: 'DSC with DBC', volumeOfCcm: '1998 cc', tank: '59L', abs: true, configurationAxis: 'RWD', transmissionType: 'Automatic' } },
        { id: 11, name: 'Performance Brake Pads', company: 'EBC', category: 'brake', partNumber: 'EBC-RP1-3SER', actualPrice: 6999, discount: 10, stockQuantity: 20, description: 'Track-tested RP-1 race compound', specs: { engineType: 'Inline-4 Turbo', engineLiters: '2.0L', engineCodes: 'B48B20', enginePower: '255 HP', brakeType: 'Disc', brakeSystem: 'DSC with DBC', volumeOfCcm: '1998 cc', tank: '59L', abs: true, configurationAxis: 'RWD', transmissionType: 'Automatic' } },
        { id: 12, name: 'Microfilter + Pollen Set', company: 'Mann-Filter', category: 'filter', partNumber: 'MN-FP3337', actualPrice: 1199, discount: 0, stockQuantity: 60, description: 'Activated charcoal cabin micro filter', specs: { engineType: 'Inline-4 Turbo', engineLiters: '2.0L', engineCodes: 'B48B20', enginePower: '255 HP', brakeType: 'Disc', brakeSystem: 'DSC', volumeOfCcm: '1998 cc', tank: '59L', abs: true, configurationAxis: 'RWD', transmissionType: 'Automatic' } },
    ],
};

const MOCK_BRANDS = ['Toyota', 'Honda', 'BMW', 'Hyundai', 'Maruti', 'Mahindra'];
const MOCK_MODELS = { Toyota: ['Camry', 'Corolla', 'RAV4', 'Innova'], Honda: ['Civic', 'City', 'Amaze'], BMW: ['3 Series', '5 Series', 'X3'], Hyundai: ['Creta', 'i20', 'Verna'], Maruti: ['Swift', 'Baleno', 'Brezza'], Mahindra: ['Thar', 'Scorpio', 'XUV700'] };
const MOCK_YEARS = { Camry: [2020, 2021, 2022, 2023, 2024], Civic: [2021, 2022, 2023], 'Corolla': [2021, 2022, 2023, 2024], 'RAV4': [2022, 2023, 2024], 'Innova': [2020, 2021, 2022, 2023], 'City': [2021, 2022, 2023, 2024], 'Amaze': [2022, 2023], '3 Series': [2021, 2022, 2023, 2024], '5 Series': [2022, 2023, 2024], 'X3': [2022, 2023, 2024], 'Creta': [2021, 2022, 2023, 2024], 'i20': [2022, 2023, 2024], 'Verna': [2023, 2024], 'Swift': [2021, 2022, 2023, 2024], 'Baleno': [2022, 2023, 2024], 'Brezza': [2022, 2023, 2024], 'Thar': [2021, 2022, 2023, 2024], 'Scorpio': [2022, 2023, 2024], 'XUV700': [2022, 2023, 2024] };

function DropdownModal({ visible, title, options, onSelect, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={s.modalOverlay} onPress={onClose}>
                <View style={s.modalSheet}>
                    <View style={s.modalHandle} />
                    <Text style={s.modalTitle}>{title}</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {options.map((opt, i) => (
                            <TouchableOpacity key={i} style={s.modalOption} onPress={() => { onSelect(opt); onClose(); }}>
                                <Text style={s.modalOptionText}>{String(opt)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
}

function SpecChip({ label, value }) {
    if (!value || value === 'N/A' || value === null) return null;
    return (
        <View style={s.specChip}>
            <Text style={s.specChipLabel}>{label}</Text>
            <Text style={s.specChipValue}>{String(value)}</Text>
        </View>
    );
}

function PartCard({ item, onPress, index }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: 1, delay: index * 60, useNativeDriver: true, tension: 70, friction: 10 }).start();
    }, []);
    const discounted = item.discount > 0 ? Math.round(item.actualPrice * (1 - item.discount / 100)) : item.actualPrice;
    const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
    const isLowStock = item.stockQuantity < 30;

    return (
        <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
            <TouchableOpacity style={s.partCard} onPress={onPress} activeOpacity={0.88}>
                <View style={s.partCardTop}>
                    <View style={[s.partIconBox, { backgroundColor: meta.color }]}>
                        <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.partName} numberOfLines={2}>{item.name}</Text>
                        <Text style={s.partCompany}>{item.company}</Text>
                    </View>
                    <View style={[s.stockBadge, isLowStock && s.stockBadgeWarn]}>
                        <Text style={[s.stockBadgeText, isLowStock && s.stockBadgeTextWarn]}>
                            {isLowStock ? 'Low stock' : 'In stock'}
                        </Text>
                    </View>
                </View>

                <Text style={s.partNumber} numberOfLines={1}>Part # {item.partNumber}</Text>

                <View style={s.partCardBottom}>
                    <View>
                        <Text style={s.partPrice}>₹{discounted.toLocaleString('en-IN')}</Text>
                        {item.discount > 0 && (
                            <Text style={s.partOriginalPrice}>₹{item.actualPrice.toLocaleString('en-IN')}</Text>
                        )}
                    </View>
                    {item.discount > 0 && (
                        <View style={s.discountBadge}>
                            <Text style={s.discountBadgeText}>{item.discount}% OFF</Text>
                        </View>
                    )}
                    <View style={[s.catBadge, { backgroundColor: meta.color + '22' }]}>
                        <Text style={[s.catBadgeText, { color: meta.color === '#F2A20C' ? '#7A4F00' : meta.color }]}>{meta.label}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function DetailModal({ part, vehicle, onClose }) {
    if (!part) return null;
    const meta = CATEGORY_META[part.category] || CATEGORY_META.other;
    const discounted = part.discount > 0 ? Math.round(part.actualPrice * (1 - part.discount / 100)) : part.actualPrice;
    const specs = part.specs || {};
    const specRows = [
        ['Engine type', specs.engineType], ['Displacement', specs.engineLiters],
        ['Engine codes', specs.engineCodes], ['Power output', specs.enginePower],
        ['Brake type', specs.brakeType], ['Brake system', specs.brakeSystem],
        ['Volume (CCM)', specs.volumeOfCcm], ['Tank capacity', specs.tank],
        ['ABS', specs.abs ? 'Yes' : 'No'], ['Drive config', specs.configurationAxis],
        ['Transmission', specs.transmissionType],
    ].filter(([, v]) => v && v !== 'N/A');

    return (
        <Modal visible={!!part} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.detailOverlay}>
                <View style={s.detailSheet}>
                    <View style={s.modalHandle} />

                    <View style={s.detailHeader}>
                        <View style={[s.detailIconBox, { backgroundColor: meta.color }]}>
                            <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={s.detailPartName}>{part.name}</Text>
                            <Text style={s.detailCompany}>{part.company} · {part.partNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <X size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.compatBanner}>
                        <Zap size={13} color="#111" />
                        <Text style={s.compatBannerText}>Compatible with {vehicle}</Text>
                    </View>

                    <Text style={s.detailDesc}>{part.description}</Text>

                    <Text style={s.specsHeading}>Technical Specifications</Text>
                    <View style={s.specsGrid}>
                        {specRows.map(([label, value]) => (
                            <SpecChip key={label} label={label} value={value} />
                        ))}
                    </View>

                    <View style={s.detailPriceRow}>
                        <View>
                            <Text style={s.detailPrice}>₹{discounted.toLocaleString('en-IN')}</Text>
                            {part.discount > 0 && <Text style={s.detailOrigPrice}>₹{part.actualPrice.toLocaleString('en-IN')}</Text>}
                        </View>
                        <View style={s.detailStock}>
                            <Text style={s.detailStockText}>{part.stockQuantity} units left</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function VehicleCompatibilityScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const numCols = width > 700 ? 2 : 1;

    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [parts, setParts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [dropdown, setDropdown] = useState(null);
    const [loadingBrands, setLoadingBrands] = useState(true);

    const heroAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }).start();
        loadBrands();
    }, []);

    useEffect(() => {
        if (activeCategory === 'all') setFiltered(parts);
        else setFiltered(parts.filter(p => p.category === activeCategory));
    }, [activeCategory, parts]);

    const getToken = async () => {
        const s = await AsyncStorage.getItem('user_session');
        return s ? JSON.parse(s).token : null;
    };

    const loadBrands = async () => {
        setLoadingBrands(true);
        try {
            const r = await axiosInstance.get('/vehicles/brands');
            setBrands(r.data || []);
        } catch {
            setBrands(MOCK_BRANDS);
        } finally {
            setLoadingBrands(false);
        }
    };

    const onBrandSelect = async (b) => {
        setBrand(b); setModel(''); setYear(''); setParts([]); setSearched(false);
        try {
            const r = await axiosInstance.get(`/vehicles/brands/${encodeURIComponent(b)}/models`);
            setModels(r.data || []);
        } catch {
            setModels(MOCK_MODELS[b] || []);
        }
    };

    const onModelSelect = async (m) => {
        setModel(m); setYear(''); setParts([]); setSearched(false);
        try {
            const r = await axiosInstance.get(`/vehicles/brands/${encodeURIComponent(brand)}/models/${encodeURIComponent(m)}/years`);
            setYears(r.data || []);
        } catch {
            setYears(MOCK_YEARS[m] || [2020, 2021, 2022, 2023, 2024]);
        }
    };

    const doSearch = async () => {
        if (!brand || !model || !year) return;
        setLoading(true); setSearched(true); setActiveCategory('all');
        try {
            const r = await axiosInstance.get(`/compatibility/search?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${year}`);
            setParts(r.data || []);
        } catch {
            const key = `${brand}_${model}_${year}`;
            const fallback = MOCK_PARTS[key] || MOCK_PARTS[`${brand}_${model}_${parseInt(year) - 1}`] || Object.values(MOCK_PARTS)[0] || [];
            setParts(fallback);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...Object.keys(CATEGORY_META)];
    const catCounts = categories.reduce((acc, c) => {
        acc[c] = c === 'all' ? parts.length : parts.filter(p => p.category === c).length;
        return acc;
    }, {});

    return (
        <View style={s.root}>
            <FlatList
                data={filtered}
                keyExtractor={item => item.id.toString()}
                numColumns={numCols}
                key={numCols}
                columnWrapperStyle={numCols > 1 ? { gap: 12, paddingHorizontal: 20 } : null}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={s.header}>
                            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                                <ArrowLeft size={20} color="#111" />
                            </TouchableOpacity>
                            <Text style={s.headerTitle}>Part Finder</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        {/* Hero */}
                        <Animated.View style={[s.hero, { opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                            <View style={s.heroAccent} />
                            <View style={s.heroAccent2} />
                            <View style={s.heroTag}>
                                <Zap size={11} color="#111" />
                                <Text style={s.heroTagText}>compatibility finder</Text>
                            </View>
                            <Text style={s.heroTitle}>Find parts for{'\n'}your exact car</Text>
                            <Text style={s.heroSub}>Select brand, model & year to see every compatible part with full specs.</Text>
                        </Animated.View>

                        {/* Selectors */}
                        <View style={s.selectorSection}>
                            <Text style={s.selectorHeading}>Your vehicle</Text>
                            <View style={s.selectorRow}>
                                {/* Brand */}
                                <TouchableOpacity style={[s.selBox, brand && s.selBoxActive]} onPress={() => setDropdown('brand')} disabled={loadingBrands}>
                                    <Text style={[s.selLabel, brand && s.selLabelActive]}>{brand || 'Brand'}</Text>
                                    <ChevronDown size={14} color={brand ? '#F2A20C' : '#888'} />
                                </TouchableOpacity>
                                {/* Model */}
                                <TouchableOpacity style={[s.selBox, model && s.selBoxActive, !brand && s.selBoxDisabled]} onPress={() => brand && setDropdown('model')}>
                                    <Text style={[s.selLabel, model && s.selLabelActive, !brand && s.selLabelDisabled]}>{model || 'Model'}</Text>
                                    <ChevronDown size={14} color={model ? '#F2A20C' : '#888'} />
                                </TouchableOpacity>
                                {/* Year */}
                                <TouchableOpacity style={[s.selBox, year && s.selBoxActive, !model && s.selBoxDisabled]} onPress={() => model && setDropdown('year')}>
                                    <Text style={[s.selLabel, year && s.selLabelActive, !model && s.selLabelDisabled]}>{year || 'Year'}</Text>
                                    <ChevronDown size={14} color={year ? '#F2A20C' : '#888'} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[s.searchBtn, (!brand || !model || !year) && s.searchBtnDisabled]}
                                onPress={doSearch}
                                disabled={!brand || !model || !year || loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#111" size="small" />
                                ) : (
                                    <>
                                        <Search size={16} color="#111" />
                                        <Text style={s.searchBtnText}>Search compatible parts</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Results section */}
                        {searched && !loading && (
                            <View>
                                {/* Vehicle pill */}
                                <View style={s.vehiclePill}>
                                    <Text style={s.vehiclePillText}>🚗 {brand} {model} {year}</Text>
                                    <View style={s.vehiclePillCount}>
                                        <Text style={s.vehiclePillCountText}>{parts.length} parts found</Text>
                                    </View>
                                </View>

                                {/* Category tabs */}
                                {parts.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryScroll}>
                                        {categories.map(cat => {
                                            const count = catCounts[cat];
                                            if (count === 0 && cat !== 'all') return null;
                                            const meta = CATEGORY_META[cat];
                                            const isActive = activeCategory === cat;
                                            return (
                                                <TouchableOpacity
                                                    key={cat}
                                                    style={[s.catTab, isActive && s.catTabActive]}
                                                    onPress={() => setActiveCategory(cat)}
                                                >
                                                    {cat !== 'all' && <Text style={{ fontSize: 13, marginRight: 4 }}>{meta.icon}</Text>}
                                                    <Text style={[s.catTabText, isActive && s.catTabTextActive]}>
                                                        {cat === 'all' ? 'All' : meta.label}
                                                    </Text>
                                                    <View style={[s.catCount, isActive && s.catCountActive]}>
                                                        <Text style={[s.catCountText, isActive && s.catCountTextActive]}>{count}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                )}

                                {parts.length === 0 && (
                                    <View style={s.emptyState}>
                                        <Text style={s.emptyIcon}>🔍</Text>
                                        <Text style={s.emptyTitle}>No parts found</Text>
                                        <Text style={s.emptySub}>No compatible parts are listed for this vehicle yet.</Text>
                                    </View>
                                )}

                                {filtered.length === 0 && parts.length > 0 && (
                                    <View style={s.emptyState}>
                                        <Text style={s.emptyIcon}>📦</Text>
                                        <Text style={s.emptyTitle}>None in this category</Text>
                                        <Text style={s.emptySub}>Try a different category.</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {!searched && (
                            <View style={s.hintBox}>
                                <Text style={s.hintIcon}>⚡</Text>
                                <Text style={s.hintText}>Select your vehicle above and tap Search to discover all compatible parts with detailed engine, brake, and transmission specs.</Text>
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View style={numCols > 1 ? { flex: 1 } : { paddingHorizontal: 20 }}>
                        <PartCard
                            item={item}
                            index={index}
                            onPress={() => setSelectedPart(item)}
                        />
                    </View>
                )}
            />

            {/* Dropdowns */}
            <DropdownModal
                visible={dropdown === 'brand'}
                title="Select Brand"
                options={brands}
                onSelect={onBrandSelect}
                onClose={() => setDropdown(null)}
            />
            <DropdownModal
                visible={dropdown === 'model'}
                title="Select Model"
                options={models}
                onSelect={onModelSelect}
                onClose={() => setDropdown(null)}
            />
            <DropdownModal
                visible={dropdown === 'year'}
                title="Select Year"
                options={years}
                onSelect={(y) => setYear(String(y))}
                onClose={() => setDropdown(null)}
            />

            {/* Part detail */}
            <DetailModal
                part={selectedPart}
                vehicle={`${brand} ${model} ${year}`}
                onClose={() => setSelectedPart(null)}
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

    hero: { marginHorizontal: 20, marginBottom: 24, backgroundColor: '#111', borderRadius: 20, padding: 24, overflow: 'hidden' },
    heroAccent: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#F2A20C', opacity: 0.15 },
    heroAccent2: { position: 'absolute', bottom: -60, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#F2A20C', opacity: 0.07 },
    heroTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F2A20C', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 12 },
    heroTagText: { fontSize: 11, fontWeight: '700', color: '#111', letterSpacing: 0.5 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 32, marginBottom: 8 },
    heroSub: { fontSize: 13, color: '#888', lineHeight: 19 },

    selectorSection: { paddingHorizontal: 20, marginBottom: 20 },
    selectorHeading: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 10 },
    selectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    selBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1.5,
        borderColor: '#E0E0E0',
        paddingVertical: 10,
        backgroundColor: 'transparent'
    },
    selBoxActive: { borderColor: '#F2A20C' },
    selBoxDisabled: { opacity: 0.45 },
    selLabel: { fontSize: 13, fontWeight: '600', color: '#888', flex: 1 },
    selLabelActive: { color: '#111' },
    selLabelDisabled: { color: '#BBB' },

    searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F2A20C', borderRadius: 12, paddingVertical: 14 },
    searchBtnDisabled: { opacity: 0.4 },
    searchBtnText: { fontSize: 15, fontWeight: '800', color: '#111' },

    vehiclePill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    vehiclePillText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    vehiclePillCount: { backgroundColor: '#F2A20C', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
    vehiclePillCountText: { fontSize: 11, fontWeight: '800', color: '#111' },

    categoryScroll: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
    catTab: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#FAFAFA' },
    catTabActive: { backgroundColor: '#111', borderColor: '#111' },
    catTabText: { fontSize: 12, fontWeight: '700', color: '#666' },
    catTabTextActive: { color: '#F2A20C' },
    catCount: { backgroundColor: '#EBEBEB', borderRadius: 99, minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
    catCountActive: { backgroundColor: '#F2A20C' },
    catCountText: { fontSize: 10, fontWeight: '800', color: '#555' },
    catCountTextActive: { color: '#111' },

    partCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#EEEEEE', padding: 16, marginBottom: 12 },
    partCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    partIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    partName: { fontSize: 14, fontWeight: '700', color: '#111', lineHeight: 19 },
    partCompany: { fontSize: 12, color: '#888', marginTop: 2 },
    stockBadge: { backgroundColor: '#EAF3DE', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
    stockBadgeWarn: { backgroundColor: '#FAEEDA' },
    stockBadgeText: { fontSize: 10, fontWeight: '700', color: '#27500A' },
    stockBadgeTextWarn: { color: '#633806' },
    partNumber: { fontSize: 11, color: '#AAAAAA', marginBottom: 10 },
    partCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
    partPrice: { fontSize: 18, fontWeight: '800', color: '#111' },
    partOriginalPrice: { fontSize: 12, color: '#BBBBBB', textDecorationLine: 'line-through' },
    discountBadge: { backgroundColor: '#F2A20C', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
    discountBadgeText: { fontSize: 10, fontWeight: '800', color: '#111' },
    catBadge: { marginLeft: 'auto', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
    catBadgeText: { fontSize: 11, fontWeight: '700' },

    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
    emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },

    hintBox: { marginHorizontal: 20, backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: '#F2A20C', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    hintIcon: { fontSize: 18 },
    hintText: { fontSize: 13, color: '#7A4F00', lineHeight: 19, flex: 1 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 16 },
    modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    modalOptionText: { fontSize: 15, color: '#111', fontWeight: '500' },

    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    detailSheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    detailIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    detailPartName: { fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 21 },
    detailCompany: { fontSize: 12, color: '#888', marginTop: 3 },
    closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
    compatBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2A20C', borderRadius: 99, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, marginBottom: 14 },
    compatBannerText: { fontSize: 12, fontWeight: '700', color: '#111' },
    detailDesc: { fontSize: 13, color: '#888', lineHeight: 19, marginBottom: 18 },
    specsHeading: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 1, marginBottom: 12 },
    specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    specChip: { backgroundColor: '#1E1E1E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
    specChipLabel: { fontSize: 10, color: '#555', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
    specChipValue: { fontSize: 13, fontWeight: '700', color: '#F2A20C' },
    detailPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 16 },
    detailPrice: { fontSize: 24, fontWeight: '800', color: '#F2A20C' },
    detailOrigPrice: { fontSize: 13, color: '#555', textDecorationLine: 'line-through' },
    detailStock: { backgroundColor: '#1E1E1E', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    detailStockText: { fontSize: 13, fontWeight: '700', color: '#888' },
});