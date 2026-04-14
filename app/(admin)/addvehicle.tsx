import axiosInstance from '@/axios/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';

const FUEL_TYPES = ['PETROL', 'DIESEL', 'EV', 'CNG', 'HYBRID', 'PLUG_IN_HYBRID', 'LPG', 'HYDROGEN'];
const TRANSMISSION_TYPES = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'AMT', 'SEMI_AUTOMATIC', 'TIPTRONIC', 'TORQUE_CONVERTER'];

function DropdownModal({ visible, title, options, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.modalOptionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function AddVehicleScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  // Form fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [power, setPower] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');

  // Modal visibility
  const [showBrand, setShowBrand] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showYear, setShowYear] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showTransmission, setShowTransmission] = useState(false);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (brand) {
      setModel('');
      setYear('');
      setModels([]);
      setYears([]);
      fetchModels(brand);
    }
  }, [brand]);

  // Fetch years when model changes
  useEffect(() => {
    if (brand && model) {
      setYear('');
      setYears([]);
      fetchYears(brand, model);
    }
  }, [model]);

  const fetchBrands = async () => {
    try {
      const res = await axiosInstance.get('/vehicles/brands');
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.brands || []);
      setBrands(list);
    } catch (e) {
      console.error('Brands fetch failed', e);
    }
  };

  const fetchModels = async (selectedBrand) => {
    try {
      const res = await axiosInstance.get(`/vehicles/brands/${selectedBrand}/models`);
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.models || []);
      setModels(list);
    } catch (e) {
      console.error('Models fetch failed', e);
    }
  };

  const fetchYears = async (selectedBrand, selectedModel) => {
    try {
      const res = await axiosInstance.get(`/vehicles/brands/${selectedBrand}/models/${selectedModel}/years`);
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.years || []);
      setYears(list.map((y: any) => y.toString()));
    } catch (e) {
      console.error('Years fetch failed', e);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!brand) e.brand = 'Brand is required';
    if (!model) e.model = 'Model is required';
    if (!year) e.year = 'Year is required';
    if (!engine.trim()) e.engine = 'Engine is required';
    if (!power.trim()) e.power = 'Power is required';
    if (!fuelType) e.fuelType = 'Fuel type is required';
    if (!transmission) e.transmission = 'Transmission is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await axiosInstance.post('/vehicles', {
        brand,
        model,
        year: parseInt(year),
        engine,
        power: parseInt(power),
        fuelType,
        transmission,
      });
      router.back();
    } catch (e: any) {
      const errorData = e?.response?.data;
      const msg = typeof errorData === 'string' ? errorData : errorData?.message || e?.message || 'Failed to create vehicle';
      
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setErrors(prev => ({ ...prev, year: 'This vehicle already exists' }));
      } else {
        Alert.alert('Error', String(msg));
      }
    } finally {
      setSaving(false);
    }
  };

  const DropdownField = ({ label, value, placeholder, onPress, error, disabled }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdown, error && styles.inputError, disabled && { opacity: 0.4 }]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !value && { color: '#AAAAAA' }]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color="#888" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color="#111111" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Add Vehicle</Text>
            <Text style={styles.pageSubtitle}>Fill in the vehicle details</Text>
          </View>
        </View>

        <View style={styles.form}>

          {/* Brand */}
          <DropdownField
            label="Brand *"
            value={brand}
            placeholder="Select brand"
            onPress={() => setShowBrand(true)}
            error={errors.brand}
          />

          {/* Model */}
          <DropdownField
            label="Model *"
            value={model}
            placeholder={brand ? 'Select model' : 'Select brand first'}
            onPress={() => setShowModel(true)}
            error={errors.model}
            disabled={!brand || models.length === 0}
          />

          {/* Year */}
          <DropdownField
            label="Year *"
            value={year}
            placeholder={model ? 'Select year' : 'Select model first'}
            onPress={() => setShowYear(true)}
            error={errors.year}
            disabled={!model || years.length === 0}
          />

          {/* Engine */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Engine *</Text>
            <TextInput
              style={[styles.input, errors.engine && styles.inputError]}
              value={engine}
              onChangeText={setEngine}
              placeholder="e.g. 2.5L 4-Cylinder"
              placeholderTextColor="#AAAAAA"
            />
            {errors.engine ? <Text style={styles.errorText}>{errors.engine}</Text> : null}
          </View>

          {/* Power */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Power (HP) *</Text>
            <TextInput
              style={[styles.input, errors.power && styles.inputError]}
              value={power}
              onChangeText={setPower}
              placeholder="e.g. 203"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
            />
            {errors.power ? <Text style={styles.errorText}>{errors.power}</Text> : null}
          </View>

          {/* Fuel Type */}
          <DropdownField
            label="Fuel Type *"
            value={fuelType}
            placeholder="Select fuel type"
            onPress={() => setShowFuel(true)}
            error={errors.fuelType}
          />

          {/* Transmission */}
          <DropdownField
            label="Transmission *"
            value={transmission}
            placeholder="Select transmission"
            onPress={() => setShowTransmission(true)}
            error={errors.transmission}
          />

        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.saveBtnText}>Save Vehicle</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <DropdownModal visible={showBrand} title="Select Brand" options={brands} onSelect={setBrand} onClose={() => setShowBrand(false)} />
      <DropdownModal visible={showModel} title="Select Model" options={models} onSelect={setModel} onClose={() => setShowModel(false)} />
      <DropdownModal visible={showYear} title="Select Year" options={years} onSelect={setYear} onClose={() => setShowYear(false)} />
      <DropdownModal visible={showFuel} title="Select Fuel Type" options={FUEL_TYPES} onSelect={setFuelType} onClose={() => setShowFuel(false)} />
      <DropdownModal visible={showTransmission} title="Select Transmission" options={TRANSMISSION_TYPES} onSelect={setTransmission} onClose={() => setShowTransmission(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  backButton: { padding: 4 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111111' },
  pageSubtitle: { fontSize: 12, color: '#888888', marginTop: 2 },

  form: { gap: 16, marginBottom: 28 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#111111' },

  input: {
    borderBottomWidth: 1.5,
    borderColor: '#EEEEEE',
    paddingVertical: 10,
    fontSize: 14,
    color: '#111111',
    backgroundColor: 'transparent',
  },
  inputError: { borderColor: '#E24B4A' },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4 },

  dropdown: {
    borderBottomWidth: 1.5,
    borderColor: '#EEEEEE',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { fontSize: 14, color: '#111111' },

  saveBtn: {
    backgroundColor: '#F2A20C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#111111' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 12 },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalOptionText: { fontSize: 14, color: '#111111' },
});