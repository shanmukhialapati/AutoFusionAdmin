import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axiosInstance from '@/axios/axiosInstance';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Change Password Error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to change password. Please verify your current password.'
      );
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Area */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Security</Text>
              <Text style={styles.subtitle}>Manage your account access</Text>
            </View>
          </Animated.View>

          {/* Main Card */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)} 
            style={styles.card}
          >
            <LinearGradient
              colors={['#1A1A1A', '#111111']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <ShieldCheck size={32} color="#F2A20C" />
              </View>

              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardDesc}>
                Set a strong password to protect your account from unauthorized access.
              </Text>

              {/* Error/Success Messages */}
              {error ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={18} color="#FF3B30" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={18} color="#32D74B" />
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              {/* Input Fields */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CURRENT PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#444" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter current password"
                      placeholderTextColor="#444"
                      secureTextEntry={!showOldPass}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                    />
                    <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeBtn}>
                      {showOldPass ? <Eye size={18} color="#F2A20C" /> : <EyeOff size={18} color="#444" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#444" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#444"
                      secureTextEntry={!showNewPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeBtn}>
                      {showNewPass ? <Eye size={18} color="#F2A20C" /> : <EyeOff size={18} color="#444" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#444" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor="#444"
                      secureTextEntry={!showConfirmPass}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                      {showConfirmPass ? <Eye size={18} color="#F2A20C" /> : <EyeOff size={18} color="#444" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>UPDATE PASSWORD</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              AUTOFUSION <Text style={{ color: '#F2A20C' }}>ADMIN</Text> SECURITY PANEL
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(242, 162, 12, 0.2)',
    elevation: 10,
    shadowColor: '#F2A20C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 162, 12, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(242, 162, 12, 0.2)',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 215, 75, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(50, 215, 75, 0.2)',
  },
  successText: {
    color: '#32D74B',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    height: 52,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 14,
  },
  submitBtn: {
    backgroundColor: '#F2A20C',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#F2A20C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#333',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
