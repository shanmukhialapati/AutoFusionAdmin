import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Settings2, } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://192.168.0.54:8081/api' });

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetaLists {
  engineTypes: string[];
  brakeTypes: string[];
  brakeSystems: string[];
  transmissions: string[];
  motorTypes: string[];

  driveTypes: string[];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CompaformScreen() {
  const router = useRouter();
  const { vehicleCompatibilityId, brand } = useLocalSearchParams<{
    vehicleCompatibilityId: string;
    brand: string;
  }>();

  // --- Meta dropdown lists ---
  const [meta, setMeta] = useState<MetaLists>({
    engineTypes: [],
    brakeTypes: [],
    brakeSystems: [],
    transmissions: [],
    motorTypes: [],

    driveTypes: [],
  });
  const [loadingMeta, setLoadingMeta] = useState(true);

  // --- Picker selections ---

  const [engineType, setEngineType] = useState('');
  const [transmissionType, setTransmissionType] = useState('');
  const [brakeType, setBrakeType] = useState('');
  const [brakeSystem, setBrakeSystem] = useState('');
  const [motorType, setMotorType] = useState('');

  // --- Text inputs ---
  const [engineLiters, setEngineLiters] = useState('');
  const [engineCodes, setEngineCodes] = useState('');
  const [enginePower, setEnginePower] = useState('');
  const [volumeOfCcm, setVolumeOfCcm] = useState('');
  const [configurationAxis, setConfigurationAxis] = useState('');
  const [tank, setTank] = useState('');
  const [abs, setAbs] = useState(false);

  // --- Submission ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Fetch all meta endpoints in parallel ─────────────────────────────────

  const fetchAllMeta = async () => {
    setLoadingMeta(true);
    try {
      const [
        engineRes,
        brakeTypeRes,
        brakeSystemRes,
        transmissionRes,
        motorRes,

        driveRes,
      ] = await Promise.allSettled([
        api.get('/meta/engine-types'),
        api.get('/meta/brake-types'),
        api.get('/meta/brake-systems'),
        api.get('/meta/transmissions'),
        api.get('/meta/motor-types'),

        api.get('/meta/drive-types'),
      ]);

      const extract = (result: PromiseSettledResult<any>): string[] => {
        if (result.status === 'fulfilled') {
          const d = result.value?.data;
          return Array.isArray(d) ? d : [];
        }
        return [];
      };

      setMeta({
        engineTypes: extract(engineRes),
        brakeTypes: extract(brakeTypeRes),
        brakeSystems: extract(brakeSystemRes),
        transmissions: extract(transmissionRes),
        motorTypes: extract(motorRes),

        driveTypes: extract(driveRes),
      });
    } catch (e) {
      console.error('Meta fetch failed', e);
    } finally {
      setLoadingMeta(false);
    }
  };
  useEffect(() => {
    fetchAllMeta();
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    console.log('[CompaForm] Validating fields...');

    if (!engineType) {
      console.warn('Validation failed: engineType');
      Alert.alert('Required', 'Please select an Engine Type.');
      return false;
    }
    if (!engineLiters || !engineLiters.trim() || isNaN(parseFloat(engineLiters))) {
      console.warn('Validation failed: engineLiters', engineLiters);
      Alert.alert('Required', 'Enter a valid Engine Displacement (L).');
      return false;
    }
    if (!enginePower || !enginePower.trim() || isNaN(parseInt(enginePower))) {
      console.warn('Validation failed: enginePower', enginePower);
      Alert.alert('Required', 'Enter a valid Engine Power (HP).');
      return false;
    }
    if (!volumeOfCcm || !volumeOfCcm.trim() || isNaN(parseInt(volumeOfCcm))) {
      console.warn('Validation failed: volumeOfCcm', volumeOfCcm);
      Alert.alert('Required', 'Enter a valid Engine Volume (CC).');
      return false;
    }
    if (!transmissionType) {
      console.warn('Validation failed: transmissionType');
      Alert.alert('Required', 'Please select a Transmission Type.');
      return false;
    }
    if (!configurationAxis || (typeof configurationAxis === 'string' && !configurationAxis.trim())) {
      console.warn('Validation failed: configurationAxis', configurationAxis);
      Alert.alert('Required', 'Please select a Drive Configuration.');
      return false;
    }
    if (!brakeType) {
      console.warn('Validation failed: brakeType');
      Alert.alert('Required', 'Please select a Brake Type.');
      return false;
    }
    if (!tank || !tank.toString().trim() || isNaN(parseFloat(tank))) {
      console.warn('Validation failed: tank', tank);
      Alert.alert('Required', 'Enter a valid Tank Capacity (L).');
      return false;
    }
    console.log('[CompaForm] Validation passed');
    return true;
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      console.log('[CompaForm] handleSave initiated. Params:', { vehicleCompatibilityId, brand });

      const vId = parseInt(vehicleCompatibilityId, 10);
      if (isNaN(vId)) {
        console.error('[CompaForm] vId is NaN. vehicleCompatibilityId:', vehicleCompatibilityId);
        Alert.alert('Error', 'Vehicle Compatibility ID is missing. Please return and try again.');
        return;
      }

      if (!validate()) return;

      setIsSubmitting(true);
      const payload = {
        vehicleCompatibilityId: vId,
        engineType,
        engineLiters: parseFloat(engineLiters),
        engineCodes: engineCodes.trim() || null,
        enginePower: parseInt(enginePower, 10),
        brakeType,
        brakeSystem: brakeSystem || null,
        motorType: motorType || null,
        volumeOfCcm: parseInt(volumeOfCcm, 10),
        tank: parseFloat(tank),
        abs,
        configurationAxis: configurationAxis.toString().trim(),
        transmissionType,

      };

      console.log('[CompaForm] POST /compatibility-details payload:', JSON.stringify(payload, null, 2));
      const res = await api.post(`/compatibility/${vId}/details`, payload);
      console.log('[CompaForm] Save successful. Response:', res.status, res.data);

      setSuccess(true);
      setTimeout(() => router.back(), 2000);

    } catch (e: any) {
      console.error('[CompaForm] Save handler error:', e);
      if (e.response) {
        console.error('[CompaForm] Backend check:', e.response.status, e.response.data);
      }
      const errorMsg = e.response?.data?.message || 'Failed to save specs. Please check all fields.';
      Alert.alert('Save Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={FadeInDown} style={styles.successCard}>
          <CheckCircle2 size={60} color="#2E7D32" />
          <Text style={styles.successTitle}>Specs Saved!</Text>
          <Text style={styles.successSub}>
            Technical specifications have been successfully saved.
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (loadingMeta) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F2A20C" />
        <Text style={styles.loadingTitle}>Loading Options...</Text>
        <Text style={styles.loadingSubtitle}>Fetching engine, brake, transmission & fuel data</Text>
      </View>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Technical Specs</Text>
            <Text style={styles.subtitle}>
              {brand ? `${brand}  ·  ` : ''}Compatibility #{vehicleCompatibilityId}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
          <View style={styles.iconCircle}>
            <Settings2 size={32} color="#F2A20C" />
          </View>
          <Text style={styles.cardTitle}>Specification Details</Text>
          <Text style={styles.cardDesc}>
            Select values from the dropdowns and fill in the remaining numeric details.
          </Text>



          {/* ── ENGINE ── */}
          <SectionHeader title="ENGINE" />
          <DynPicker
            label="ENGINE TYPE *"
            value={engineType}
            onChange={setEngineType}
            options={meta.engineTypes}
            placeholder="Select engine type..."
          />
          <InputRow>
            <InputField label="DISPLACEMENT (L) *" value={engineLiters} onChange={setEngineLiters} placeholder="e.g. 2.5" keyboardType="decimal-pad" flex={1} />
            <InputField label="POWER (HP) *" value={enginePower} onChange={setEnginePower} placeholder="e.g. 208" keyboardType="numeric" flex={1} />
          </InputRow>
          <InputRow>
            <InputField label="VOLUME (CC) *" value={volumeOfCcm} onChange={setVolumeOfCcm} placeholder="e.g. 2494" keyboardType="numeric" flex={1} />
            <InputField label="ENGINE CODE" value={engineCodes} onChange={setEngineCodes} placeholder="e.g. 2AR-FE" flex={1} />
          </InputRow>

          {/* ── TRANSMISSION & DRIVE ── */}
          <SectionHeader title="TRANSMISSION & DRIVE" />
          <DynPicker
            label="TRANSMISSION TYPE *"
            value={transmissionType}
            onChange={setTransmissionType}
            options={meta.transmissions}
            placeholder="Select transmission..."
          />
          <DynPicker
            label="DRIVE CONFIGURATION *"
            value={configurationAxis}
            onChange={setConfigurationAxis}
            options={meta.driveTypes}
            placeholder="Select drive configuration..."
          />

          {/* ── BRAKES ── */}
          <SectionHeader title="BRAKING SYSTEM" />
          <DynPicker
            label="BRAKE TYPE *"
            value={brakeType}
            onChange={setBrakeType}
            options={meta.brakeTypes}
            placeholder="Select brake type..."
          />
          <DynPicker
            label="BRAKE SYSTEM"
            value={brakeSystem}
            onChange={setBrakeSystem}
            options={meta.brakeSystems}
            placeholder="Select brake system..."
          />
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>ANTI-LOCK BRAKING (ABS)</Text>
              <Text style={styles.switchSub}>{abs ? 'Equipped' : 'Not equipped'}</Text>
            </View>
            <Switch
              value={abs}
              onValueChange={setAbs}
              trackColor={{ false: '#E0E0E0', true: '#F2A20C' }}
              thumbColor={abs ? '#111' : '#FFF'}
            />
          </View>

          {/* ── OTHER ── */}
          <SectionHeader title="OTHER" />
          <InputRow>
            <InputField label="TANK CAPACITY (L) *" value={tank} onChange={setTank} placeholder="e.g. 70" keyboardType="decimal-pad" flex={1} />
            <View style={{ flex: 1 }}>
              <DynPicker
                label="MOTOR TYPE"
                value={motorType}
                onChange={setMotorType}
                options={meta.motorTypes}
                placeholder="Select motor type..."
              />
            </View>
          </InputRow>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.submitBtnText}>SAVE SPECIFICATIONS</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          AUTOFUSION <Text style={{ color: '#F2A20C' }}>ADMIN</Text> PORTAL
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function InputRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

interface DynPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}
function DynPicker({ label, value, onChange, options, placeholder }: DynPickerProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerWrapper, !value && styles.pickerHighlight]}>
        <Picker
          selectedValue={value}
          onValueChange={(v: string) => onChange(v)}
          style={styles.picker}
          dropdownIconColor="#555"
        >
          <Picker.Item label={placeholder || 'Select...'} value="" color="#999" />
          {options.map((opt) => (
            <Picker.Item key={opt} label={opt} value={opt} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  flex?: number;
}
function InputField({ label, value, onChange, placeholder, keyboardType = 'default', flex }: InputFieldProps) {
  return (
    <View style={[styles.formGroup, flex ? { flex } : {}]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#BBBBBB"
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAFAFA', padding: 24,
  },
  loadingTitle: {
    fontSize: 18, fontWeight: '700', color: '#111', marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 16 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFBEB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 6 },
  cardDesc: {
    fontSize: 13, color: '#666', textAlign: 'center',
    lineHeight: 20, marginBottom: 20, paddingHorizontal: 8,
  },
  sectionHeader: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 8, marginBottom: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#F2A20C', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1.5, backgroundColor: '#FFF3CD' },
  row: { flexDirection: 'row', width: '100%', gap: 12 },
  formGroup: { width: '100%', marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 1.5, marginBottom: 8 },
  pickerWrapper: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  pickerHighlight: { borderColor: '#F2A20C33' },
  picker: { height: 48, width: '100%' },
  textInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#F1F5F9',
    height: 48, paddingHorizontal: 14, fontSize: 14, color: '#111', fontWeight: '500',
  },
  switchRow: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
    paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: '#F5F5F5',
  },
  switchSub: { fontSize: 12, color: '#555', fontWeight: '500', marginTop: 2 },
  submitBtn: {
    width: '100%', height: 52, backgroundColor: '#F2A20C', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    elevation: 3, shadowColor: '#F2A20C',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  successContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F0FDF4', padding: 24,
  },
  successCard: {
    backgroundColor: '#FFF', borderRadius: 32, padding: 40,
    width: '100%', maxWidth: 400, alignItems: 'center',
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 40,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#166534', marginTop: 20, marginBottom: 8 },
  successSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { fontSize: 10, fontWeight: '700', color: '#DDD', letterSpacing: 2 },
});