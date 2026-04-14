import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  SensorType,
  useAnimatedSensor,
  FadeInUp,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Eye, EyeOff } from 'lucide-react-native';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'expo-router';
import axiosInstance from '../axios/axiosInstance';
import { SafeStorage } from './utils/storage';


export default function Index() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 768;


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');


  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const floatValue = useSharedValue(0);
  const sensor = Platform.OS !== 'web' ? useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 20 }) : null;

  useEffect(() => {
    console.log('[autofusion] Initializing Gateway Root...');


    const checkSession = async () => {
      try {
        const stored = await SafeStorage.getItem('user_session');
        if (stored) {
          console.log('[autofusion] Session detected, but keeping user at gateway for administrative sync.');
        }
      } catch (e) {
        console.warn("[autofusion] Session check failed", e);
      } finally {
        console.log('[autofusion] Gateway Ready.');
        setInitialLoading(false);
      }
    };

    checkSession();

    const safety = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);


    floatValue.value = withRepeat(
      withTiming(1, { duration: 3500 }),
      -1,
      true
    );

    if (Platform.OS === 'web') {
      const handleMouseMove = (e: MouseEvent) => {
        const centerX = windowWidth / 4;
        const centerY = windowHeight / 2;
        posX.value = (e.clientX - centerX) / (windowWidth / 4);
        posY.value = (e.clientY - centerY) / (windowHeight / 2);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(safety);
      };
    }
    return () => clearTimeout(safety);
  }, [windowWidth, windowHeight]);


  useEffect(() => {
    if (Platform.OS !== 'web' && sensor) {
      const { x, y } = sensor.sensor.value;
      posX.value = withSpring(x / 5, { damping: 25 });
      posY.value = withSpring(y / 5, { damping: 25 });
    }
  }, [sensor]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('the format for email is not correct');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const token = response.data.token;
      const decoded: any = jwtDecode(token);

      await SafeStorage.clear();
      await SafeStorage.setItem('user_session', JSON.stringify(response.data));
      if (Platform.OS === 'web') {
        localStorage.setItem('admin_role', decoded.role);
        localStorage.setItem('admin_id', decoded.sub);
        localStorage.setItem('token_expires', new Date(decoded.exp * 1000).toLocaleString());
      }

      router.replace('/(admin)/dashboard');
    } catch (err: any) {
      setError('wrong credentials');
    } finally {
      setLoading(false);
    }
  };

  const carStyle = useAnimatedStyle(() => {
    const floatY = interpolate(floatValue.value, [0, 1], [-5, 5]);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: withSpring(posX.value * 6, { damping: 25, stiffness: 80 }) },
        { translateY: withSpring(posY.value * 4 + floatY, { damping: 25, stiffness: 80 }) },
        { rotateX: withSpring(`${posY.value * -2}deg`, { damping: 25 }) },
        { rotateY: withSpring(`${posX.value * 6}deg`, { damping: 25 }) },
        { rotateZ: withSpring(`${posX.value * 1}deg`, { damping: 25 }) },
        { scale: 1.15 },
      ],
    };
  });

  const glossStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(posX.value * -20, { damping: 15 }) },
      { translateY: withSpring(posY.value * -15, { damping: 15 }) },
    ],
    opacity: interpolate(Math.abs(posX.value) + Math.abs(posY.value), [0, 1.5], [0, 0.5]),
  }));

  if (initialLoading) return null;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
      >
        <View style={[styles.centeredContent, isMobile && styles.mobileCenteredContent]}>
          <View style={[
            styles.shadowCard,
            isMobile && styles.mobileShadowCard
          ]}>
            <View style={[styles.partitionContainer, isMobile && styles.mobilePartitionContainer]}>

              {!isMobile && (
                <View style={styles.leftPartition}>
                  <View style={[styles.flexOne, styles.carViewport]}>
                    <View style={styles.sonarContainer}>
                      {[0, 1, 2].map((i) => (
                        <SonarRing key={i} delay={i * 900} />
                      ))}
                    </View>
                    <Animated.View
                      style={[
                        styles.underGlow,
                        { transform: [{ translateX: withSpring(posX.value * 5) }, { translateY: withSpring(posY.value * 4) }] }
                      ]}
                    />
                    <Animated.View style={[styles.carContainer, carStyle]}>
                      <Image
                        source={require('../assets/sonar_car.png')}
                        style={styles.carImage}
                        contentFit="contain"
                      />
                      <Animated.View style={[styles.glossLayer, glossStyle]} />
                    </Animated.View>
                  </View>

                  <View style={styles.graphicsOverlay}>
                    <Text style={styles.heroTitle}>auto<Text style={{ color: '#F2A20C' }}>fusion</Text></Text>
                    <Text style={styles.heroSub}>Unleash your administrative efficiency with specialized fleet controls.</Text>
                  </View>
                </View>
              )}

              {/* RIGHT: LOGIN INTERFACE */}
              <View style={[styles.rightPartition, isMobile && styles.mobileRightPartition]}>
                {isMobile && (
                  <View style={styles.mobileHeroContainer}>
                    <View style={styles.mobileLogoContainer}>
                      <View style={styles.autoBadge}>
                        <Text style={styles.autoText}>AUTO</Text>
                      </View>
                      <Text style={styles.fusionText}>FUSION</Text>
                    </View>
                    <View style={styles.gatewayTag}>
                      <Text style={styles.mobileHeroSubtitle}>ADMINISTRATIVE GATEWAY</Text>
                    </View>
                    <Text style={styles.heroSubMobile}>Executive multi-fleet control and secure monitoring.</Text>
                  </View>
                )}
                {!isMobile && (
                  <View style={styles.logoSlot}>
                    <View style={styles.logoMock} />
                    <Text style={[styles.logoTitle, { color: '#F2A20C' }]}>FUSION</Text>
                  </View>
                )}

                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.formWrapper}>
                  <View style={[styles.headerContainer, isMobile && { marginTop: 0 }]}>
                    {!isMobile && <Text style={styles.brandName}>Login now</Text>}
                    <Text style={[styles.subtitle, isMobile && styles.mobileSubtitle]}>Secure Admin Access.</Text>
                  </View>

                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, isMobile && { color: '#F2A20C' }]}>Admin Email</Text>
                      <View style={[styles.inputWrapper, isMobile && styles.mobileInputWrapper]}>
                        <TextInput
                          style={[styles.input, isMobile && { color: '#FFFFFF' }]}
                          placeholder="Enter your email"
                          placeholderTextColor={isMobile ? "#555" : "#999"}
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, isMobile && { color: '#F2A20C' }]}>Password</Text>
                      <View style={[styles.inputWrapper, isMobile && styles.mobileInputWrapper]}>
                        <TextInput
                          style={[styles.input, isMobile && { color: '#FFFFFF' }]}
                          placeholder="Enter password"
                          placeholderTextColor={isMobile ? "#555" : "#999"}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                          {showPassword ? <EyeOff size={18} color={isMobile ? "#888" : "#999"} /> : <Eye size={18} color={isMobile ? "#888" : "#999"} />}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={[styles.loginButton, isMobile && styles.mobileLoginButton]} onPress={handleLogin} disabled={loading}>
                      {loading ? <ActivityIndicator color={isMobile ? "#000" : "#FFF"} /> : <Text style={[styles.loginButtonText, isMobile && { color: '#000' }]}>Login now</Text>}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>

            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


const SonarRing = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(withDelay(delay, withTiming(2.2, { duration: 3000 })), -1, false);
    opacity.value = withRepeat(withDelay(delay, withTiming(0, { duration: 3000 })), -1, false);
  }, [delay]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.ring, ringStyle]} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  flexOne: { flex: 1 },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  shadowCard: {
    width: '100%', maxWidth: 960, height: 600, backgroundColor: '#FFFFFF', borderRadius: 24,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 30, elevation: 10, flexDirection: 'row',
  },
  partitionContainer: { flex: 1, flexDirection: 'row' },
  leftPartition: { flex: 1, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  carViewport: { width: '100%', justifyContent: 'center', alignItems: 'center' },
  carContainer: { width: 400, height: 700, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  carImage: { width: '100%', height: '100%', zIndex: 2 },
  sonarContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', opacity: 0.6 },
  ring: { position: 'absolute', width: 350, height: 350, borderRadius: 175, borderWidth: 1, borderColor: 'rgba(74, 144, 226, 0.4)', backgroundColor: 'rgba(74, 144, 226, 0.03)' },
  underGlow: { position: 'absolute', width: 250, height: 120, backgroundColor: 'rgba(74, 144, 226, 0.2)', borderRadius: 125, top: '45%', filter: Platform.OS === 'web' ? 'blur(80px)' : undefined, zIndex: 1 },
  glossLayer: { position: 'absolute', width: '160%', height: '160%', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1000, top: -250, left: -250, filter: Platform.OS === 'web' ? 'blur(160px)' : undefined, zIndex: 3, pointerEvents: 'none' },
  graphicsOverlay: { position: 'absolute', bottom: 40, paddingHorizontal: 40, alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#111111', marginBottom: 8 },
  heroSub: { fontSize: 12, color: '#666666', textAlign: 'center', lineHeight: 18 },
  heroSubMobile: { fontSize: 10, color: '#AAAAAA', textAlign: 'center', lineHeight: 16, marginTop: 10, maxWidth: '85%' },
  mobileLogoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  autoBadge: { backgroundColor: '#F2A20C', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  autoText: { color: '#000000', fontSize: 20, fontWeight: '900' },
  fusionText: { color: '#F2A20C', fontSize: 20, fontWeight: '900' },
  gatewayTag: { borderBottomWidth: 1, borderBottomColor: 'rgba(242, 162, 12, 0.3)', paddingBottom: 4, width: '40%', alignItems: 'center' },
  mobileHeroSubtitle: { fontSize: 8, fontWeight: '800', letterSpacing: 2, color: '#F2A20C' },
  rightPartition: { flex: 1, backgroundColor: '#FFFFFF', padding: 60, justifyContent: 'center' },
  mobileRightPartition: { flex: 0, width: '100%', padding: 25, paddingVertical: 20 },
  mobileHeroContainer: { width: '100%', marginBottom: 0, alignItems: 'center' },
  mobileLogoRow: { flexDirection: 'row', alignItems: 'center' },
  logoSlot: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, justifyContent: 'center' },
  logoMock: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#6D7D7D', marginRight: 10 },
  logoTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 2, color: '#333333' },
  formWrapper: { width: '100%' },
  headerContainer: { marginBottom: 0, alignItems: 'center' },
  brandName: { fontSize: 28, fontWeight: '700', color: '#111111' },
  subtitle: { fontSize: 12, color: '#888888', marginTop: 2, textAlign: 'center' },
  mobileSubtitle: { color: '#AAAAAA', marginTop: 0, textAlign: 'center', fontSize: 11 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#555555', marginBottom: 6 },
  inputWrapper: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderColor: '#EEEEEE',
    height: 48,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileInputWrapper: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderColor: '#333333',
    height: 54,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, color: '#111111', fontSize: 14, height: '100%', outlineStyle: 'none' } as any,
  eyeIcon: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#E74C3C', fontSize: 12, marginTop: 5 },
  loginButton: { width: '100%', height: 48, borderRadius: 8, backgroundColor: '#1C1C1C', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mobileLoginButton: { backgroundColor: '#F2A20C', height: 54, borderRadius: 12, marginTop: 20 },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  mobileCenteredContent: { padding: 25, backgroundColor: '#000000' },
  mobileShadowCard: {
    width: '100%',
    height: 'auto',
    borderRadius: 32,
    backgroundColor: '#0A0A0A',
    elevation: 20,
    shadowColor: '#F2A20C',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    paddingBottom: 20
  },
  mobilePartitionContainer: { flex: 0, width: '100%', flexDirection: 'column' },
});
