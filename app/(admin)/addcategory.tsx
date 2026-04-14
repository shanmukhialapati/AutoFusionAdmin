import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, LayoutGrid } from 'lucide-react-native';
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

export default function AddCategoryScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Category name is required';
    if (trimmed.length < 2) return 'Must be at least 2 characters';
    return '';
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
      setImageError('');
    }
  };


  const handleAdd = async () => {
    const nErr = validateName(name);
    const noImage = !imageUri;

    if (nErr) setNameError(nErr);
    if (noImage) setImageError('Image is required');
    if (nErr || noImage) return;

    try {
      setLoading(true);

      // Build Multipart Form Data for unified request
      const formData = new FormData();
      formData.append('name', name.trim());

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri!);
        const blob = await response.blob();
        const file = new File([blob], 'category.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'category.jpg',
        } as any);
      }

      console.log('🚀 Sending Multipart POST to /categories...');

      const res = await axiosInstance.post(
        '/categories',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Created Category:', JSON.stringify(res.data));
      router.back();

    } catch (e: any) {
      const errorData = e?.response?.data;
      const msg = typeof errorData === 'string' ? errorData : errorData?.message || e?.message || 'Failed to create category';
      
      console.error('❌ Full error:', JSON.stringify(errorData));

      // Handle duplicate name specifically
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
        setNameError('This category name already exists');
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
                  <LayoutGrid size={20} color="#000" />
                </View>
                <Text style={styles.cardTitle}>Add Category</Text>
              </View>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <ArrowLeft size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.formContent}>
              {/* Image Picker */}
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={[
                    styles.imagePickerFrame,
                    imageError ? { borderColor: '#E74C3C' } : null,
                  ]}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Camera size={28} color="#F2A20C" />
                      <Text style={styles.placeholderText}>Select Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* ✅ FIX 5: Show imageError in UI */}
                {imageError ? (
                  <Text style={[styles.errorText, { marginTop: 8 }]}>{imageError}</Text>
                ) : (
                  <Text style={styles.formTip}>
                    Recommended: Square PNG or JPG (white background)
                  </Text>
                )}
              </View>

              {/* Fields */}
              <View style={styles.formFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category Name *</Text>
                  <View style={[styles.inputWrapper, nameError ? styles.inputError : null]}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Engine Parts"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        setNameError(validateName(text));
                      }}
                    />
                  </View>
                  {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleAdd}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Category</Text>
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
    maxWidth: 500,
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
    width: 40,
    height: 40,
    backgroundColor: '#F2A20C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
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
    marginBottom: 24,
  },
  imagePickerFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F2A20C',
    marginTop: 6,
  },
  formTip: {
    fontSize: 10,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 14,
  },
  formFields: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.5,
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
    backgroundColor: '#FFF5F5',
  },
  input: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E74C3C',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FDF7E7',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(242, 162, 12, 0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#B8860B',
    lineHeight: 16,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#F2A20C',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F2A20C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});