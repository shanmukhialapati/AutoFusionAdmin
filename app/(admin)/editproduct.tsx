import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Package, Info, Tag, Hash, IndianRupee, Layers } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

import axiosInstance from '@/axios/axiosInstance';

export default function EditProductScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();


  const {
    id,
    name: initialName,
    description: initialDesc,
    partNumber: initialPN,
    company: initialCompany,
    actualPrice: initialPrice,
    discount: initialDiscount,
    stockQuantity: initialStock,
    subCategoryId,
    photoUrl: initialPhoto
  } = searchParams;

  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;


  const [name, setName] = useState(initialName as string || '');
  const [description, setDescription] = useState(initialDesc as string || '');
  const [partNumber, setPartNumber] = useState(initialPN as string || '');
  const [company, setCompany] = useState(initialCompany as string || '');
  const [actualPrice, setActualPrice] = useState(initialPrice as string || '');
  const [discount, setDiscount] = useState(
    initialDiscount && initialDiscount !== '0' ? (initialDiscount as string) : ''
  );
  const [stockQuantity, setStockQuantity] = useState(initialStock as string || '');

  const [imageUri, setImageUri] = useState<string | null>(initialPhoto as string || null);
  const [loading, setLoading] = useState(false);


  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!partNumber.trim()) newErrors.partNumber = 'Part number is required';
    if (!company.trim()) newErrors.company = 'Company / brand is required';
    if (!actualPrice.trim() || isNaN(Number(actualPrice)) || Number(actualPrice) <= 0)
      newErrors.actualPrice = 'Enter a valid price greater than 0';
    if (discount.trim() !== '' && (isNaN(Number(discount)) || Number(discount) < 0 || Number(discount) > 100))
      newErrors.discount = 'Discount must be 0–100';
    if (!stockQuantity.trim() || isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0)
      newErrors.stockQuantity = 'Enter a valid stock quantity';
    if (!imageUri) newErrors.image = 'Please upload a product photo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const formData = new FormData();

      const productData = {
        name: name.trim(),
        description: description.trim() || 'No description',
        partNumber: partNumber.trim(),
        company: company.trim(),
        actualPrice: Number(actualPrice),
        discount: Number(discount || 0),
        stockQuantity: Number(stockQuantity),
        subCategoryId: Number(subCategoryId),
      };
      formData.append('data', JSON.stringify(productData));

      const isNewImage = imageUri && !imageUri.startsWith('http');
      if (isNewImage) {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri!);
          const blob = await response.blob();
          formData.append('file', new File([blob], 'product.jpg', { type: 'image/jpeg' }));
        } else {
          formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'product.jpg' } as any);
        }
      } else if (imageUri) {
        formData.append('existingPhotoUrl', imageUri);
      }

      console.log(`🚀 Sending Multipart PUT to /api/products/${id}...`);

      const res = await axiosInstance.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Updated Product:', JSON.stringify(res.data));
      router.back();

    } catch (e: any) {
      const errorData = e?.response?.data;
      const msg = typeof errorData === 'string' ? errorData : errorData?.message || e?.message || 'Failed to update product';

      console.error('❌ Full error:', JSON.stringify(errorData));

      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('part number already exists')) {
        setErrors(prev => ({ ...prev, partNumber: 'This part number already exists' }));
      } else if (lowerMsg.includes('already exists') || lowerMsg.includes('duplicate')) {
        setErrors(prev => ({ ...prev, name: 'This product name already exists' }));
      } else {
        Alert.alert('Error', String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.centeredContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.duration(1000)}
            style={[styles.shadowCard, isMobile && styles.mobileShadowCard]}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.brandContainer}>
                <View style={styles.logoBadge}>
                  <Package size={20} color="#000" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Edit Product</Text>
                  <Text style={styles.cardSubtitle}>COMMAND_STAGE // UPDATING_ENTITY</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <ArrowLeft size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.formContent}>
              {/* Image Section */}
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={[
                    styles.imagePickerFrame,
                    errors.image ? { borderColor: '#E74C3C' } : null,
                  ]}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Camera size={28} color="#F2A20C" />
                      <Text style={styles.placeholderText}>UPLOAD PRODUCT PHOTO</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.image && <Text style={styles.errorLabel}>{errors.image}</Text>}
              </View>

              {/* Grid Fields */}
              <View style={styles.formFields}>

                {/* Product Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Info size={12} color="#F2A20C" />
                    <Text style={styles.label}>PRODUCT NAME</Text>
                  </View>
                  <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Brake Pad X-200"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorLabel}>{errors.name}</Text>}
                </View>

                {/* Part Number & Company */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.labelRow}>
                      <Hash size={12} color="#F2A20C" />
                      <Text style={styles.label}>PART NUMBER / SKU</Text>
                    </View>
                    <View style={[styles.inputWrapper, errors.partNumber && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="PN-XXXX"
                        placeholderTextColor="#999"
                        value={partNumber}
                        onChangeText={setPartNumber}
                      />
                    </View>
                    {errors.partNumber && <Text style={styles.errorLabel}>{errors.partNumber}</Text>}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.labelRow}>
                      <Tag size={12} color="#F2A20C" />
                      <Text style={styles.label}>COMPANY / BRAND</Text>
                    </View>
                    <View style={[styles.inputWrapper, errors.company && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Bosch"
                        placeholderTextColor="#999"
                        value={company}
                        onChangeText={setCompany}
                      />
                    </View>
                    {errors.company && <Text style={styles.errorLabel}>{errors.company}</Text>}
                  </View>
                </View>

                {/* Price & Discount & Stock */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <View style={styles.labelRow}>
                      <IndianRupee size={12} color="#F2A20C" />
                      <Text style={styles.label}>ACTUAL PRICE</Text>
                    </View>
                    <View style={[styles.inputWrapper, errors.actualPrice && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 999.99"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                        value={actualPrice}
                        onChangeText={setActualPrice}
                      />
                    </View>
                    {errors.actualPrice && <Text style={styles.errorLabel}>{errors.actualPrice}</Text>}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.labelRow}>
                      <Tag size={12} color="#F2A20C" />
                      <Text style={styles.label}>DISC %</Text>
                    </View>
                    <View style={[styles.inputWrapper, errors.discount && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 10"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                        value={discount}
                        onChangeText={setDiscount}
                      />
                    </View>
                    {errors.discount && <Text style={styles.errorLabel}>{errors.discount}</Text>}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.labelRow}>
                      <Layers size={12} color="#F2A20C" />
                      <Text style={styles.label}>STOCK</Text>
                    </View>
                    <View style={[styles.inputWrapper, errors.stockQuantity && styles.inputError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="qty"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                        value={stockQuantity}
                        onChangeText={setStockQuantity}
                      />
                    </View>
                    {errors.stockQuantity && <Text style={styles.errorLabel}>{errors.stockQuantity}</Text>}
                  </View>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PRODUCT DESCRIPTION (OPTIONAL)</Text>
                  </View>
                  <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                    <TextInput
                      style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                      placeholder="Enter specifications..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>UPDATE PRODUCT DETAILS</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA'
  },
  shadowCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  mobileShadowCard: {
    padding: 24,
    borderRadius: 0,
    elevation: 0,
    borderWidth: 0,
    width: '100%',
    maxWidth: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    backgroundColor: '#F2A20C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 2,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginBottom: 24,
  },
  formContent: {
    width: '100%',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imagePickerFrame: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EEEEEE',
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#AAA',
    marginTop: 12,
    letterSpacing: 1,
  },
  formFields: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderColor: '#EEEEEE',
    height: 48,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF8F8',
  },
  input: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
  },
  errorLabel: {
    color: '#E74C3C',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#F2A20C',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#F2A20C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
