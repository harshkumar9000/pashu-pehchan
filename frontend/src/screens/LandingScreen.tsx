import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Image,
} from 'react-native';
import {
  Sparkles,
  Star,
  Play,
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCircle2,
  MapPin,
  Sun,
  Cloud,
  Wind,
  Layers,
  ShieldCheck,
  TrendingUp,
  X,
  Camera,
  BookOpen,
  Award,
  Users,
  Compass,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { ScreenName, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DynamicSearchBar } from '../components/DynamicSearchBar';
import { LanguageSelector } from '../components/LanguageSelector';

interface LandingScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const { switchDemoRole } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    if (mode === 'login') {
      onNavigate('login');
    } else {
      onNavigate('register');
    }
  };

  const handleSelectRoleAndEnter = async (role: UserRole) => {
    await switchDemoRole(role);
    setShowAuthModal(false);
    if (role === 'MIDDLEMAN') {
      onNavigate('middleman_home');
    } else if (role === 'ADMIN') {
      onNavigate('admin');
    } else {
      onNavigate('home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* ================= 1. FLOATING TOP NAVBAR ================= */}
      <View style={styles.navWrapper}>
        <View style={styles.navBar}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => onNavigate('landing')}
            activeOpacity={0.8}
            accessibilityLabel="PashuPehchan Home"
          >
            <Image
              source={{ uri: '/logo.png' }}
              style={styles.navLogoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoText}>PashuPehchan</Text>
              <Text style={styles.logoSubText}>AI LIVESTOCK PLATFORM</Text>
            </View>
          </TouchableOpacity>

          {/* Nav Links (Desktop) */}
          <View style={styles.navLinks}>
            <TouchableOpacity style={styles.navPillActive} activeOpacity={0.8}>
              <Compass size={14} color={colors.primary} />
              <Text style={styles.navPillActiveText}>{t('product')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink} activeOpacity={0.7} onPress={() => onNavigate('breeds')}>
              <Text style={styles.navLinkText}>{t('features')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink} activeOpacity={0.7} onPress={() => onNavigate('farmer_marketplace')}>
              <Text style={styles.navLinkText}>{t('marketplace')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink} activeOpacity={0.7} onPress={() => onNavigate('vets')}>
              <Text style={styles.navLinkText}>{t('veterinary')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink} activeOpacity={0.7} onPress={() => onNavigate('system_info')}>
              <Text style={styles.navLinkText}>{t('aiModel')}</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Real-Time Search Bar */}
          <DynamicSearchBar onNavigate={onNavigate} />

          {/* Top Right: Translate & Log in / Sign up Buttons */}
          <View style={styles.navRight}>
            <LanguageSelector />

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => handleOpenAuth('login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginBtnText}>{t('login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => handleOpenAuth('signup')}
              activeOpacity={0.85}
            >
              <Text style={styles.signupBtnText}>{t('signup')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= 2. HERO HEADER SECTION ================= */}
      <View style={styles.heroSection}>
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingLabel}>Rated</Text>
          <Text style={styles.ratingScore}>4.9</Text>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingCount}>by 10,000+ Indian farmers</Text>
        </View>

        {/* Hero Title */}
        <Text style={styles.heroTitle}>
          Pashu Ko Pehchano,{'\n'}
          <Text style={styles.heroTitleItalic}>Behtar Sambhalo</Text>
        </Text>

        {/* Hero Subtitle */}
        <Text style={styles.heroSubtitle}>
          {t('heroSubtitle')}
        </Text>

        {/* Hero CTAs */}
        <View style={styles.heroCtaRow}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={() => handleOpenAuth('signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryCtaText}>{t('startFreeTrial')}</Text>
            <ArrowUpRight size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCtaBtn}
            onPress={() => onNavigate('scan')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryCtaText}>{t('howItWorks')}</Text>
            <View style={styles.playIconCircle}>
              <Play size={12} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= 3. CENTERPIECE: ANIMATED VECTOR COW & DASHBOARD ================= */}
        <View style={styles.dashboardHeroFrame}>
          {/* Pastoral Landscape View with Animated Vector Cow */}
          <View style={styles.pastoralCanvas}>
            {/* Pastoral Nature Background SVG with Rolling Hills & Sky */}
            <svg
              style={styles.pastoralSvgBackground as any}
              viewBox="0 0 1000 480"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="pastoralSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9E6F8" />
                  <stop offset="45%" stopColor="#E6F4EA" />
                  <stop offset="100%" stopColor="#CEEBD9" />
                </linearGradient>
                <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#81C784" />
                  <stop offset="100%" stopColor="#43A047" />
                </linearGradient>
                <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66BB6A" />
                  <stop offset="100%" stopColor="#2E7D32" />
                </linearGradient>
                <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#1B5E20" />
                </linearGradient>
              </defs>

              {/* Sky */}
              <rect width="1000" height="480" fill="url(#pastoralSky)" />

              {/* Distant mountains/hills */}
              <path
                d="M-50,300 Q180,180 400,260 T850,220 Q950,200 1050,270 L1050,480 L-50,480 Z"
                fill="url(#hillBack)"
                opacity="0.65"
              />

              {/* Mid-ground rolling field */}
              <path
                d="M-50,340 Q150,250 420,310 T880,290 Q980,280 1050,330 L1050,480 L-50,480 Z"
                fill="url(#hillMid)"
                opacity="0.85"
              />

              {/* Foreground lush pasture */}
              <path
                d="M-50,380 Q200,310 500,360 T1050,350 L1050,480 L-50,480 Z"
                fill="url(#hillFront)"
              />

              {/* Windmill & trees in background */}
              <g opacity="0.75" transform="translate(140, 200)">
                <line x1="30" y1="90" x2="30" y2="40" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" />
                <circle cx="30" cy="40" r="4" fill="#1B5E20" />
                <line x1="30" y1="40" x2="55" y2="25" stroke="#1B5E20" strokeWidth="2.5" />
                <line x1="30" y1="40" x2="5" y2="55" stroke="#1B5E20" strokeWidth="2.5" />
                <line x1="30" y1="40" x2="15" y2="15" stroke="#1B5E20" strokeWidth="2.5" />
                <line x1="30" y1="40" x2="45" y2="65" stroke="#1B5E20" strokeWidth="2.5" />
              </g>

              {/* Distant farm fence */}
              <g opacity="0.4" stroke="#D7CCC8" strokeWidth="2">
                <line x1="280" y1="310" x2="480" y2="305" />
                <line x1="280" y1="318" x2="480" y2="313" />
                <line x1="300" y1="300" x2="300" y2="325" />
                <line x1="350" y1="298" x2="350" y2="323" />
                <line x1="400" y1="296" x2="400" y2="321" />
                <line x1="450" y1="294" x2="450" y2="319" />
              </g>

              {/* Flowers / Daisies in foreground */}
              <g transform="translate(180, 420)">
                <circle cx="10" cy="10" r="5" fill="#FFF59D" />
                <circle cx="5" cy="5" r="4" fill="#FFFFFF" />
                <circle cx="15" cy="5" r="4" fill="#FFFFFF" />
                <circle cx="5" cy="15" r="4" fill="#FFFFFF" />
                <circle cx="15" cy="15" r="4" fill="#FFFFFF" />
              </g>
              <g transform="translate(720, 410)">
                <circle cx="10" cy="10" r="5" fill="#FFF59D" />
                <circle cx="5" cy="5" r="4" fill="#FFFFFF" />
                <circle cx="15" cy="5" r="4" fill="#FFFFFF" />
                <circle cx="5" cy="15" r="4" fill="#FFFFFF" />
                <circle cx="15" cy="15" r="4" fill="#FFFFFF" />
              </g>
            </svg>

            {/* ANIMATED VECTOR COW EATING GRASS (SVG with embedded CSS Keyframe Animations) */}
            <div style={styles.animatedCowContainer as any}>
              <svg
                width="280"
                height="220"
                viewBox="0 0 280 220"
                fill="none"
                style={{ overflow: 'visible' }}
              >
                <style>
                  {`
                    @keyframes cowBreathe {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-3px); }
                    }
                    @keyframes cowTail {
                      0%, 100% { transform: rotate(-8deg); }
                      50% { transform: rotate(18deg); }
                    }
                    @keyframes cowEarLeft {
                      0%, 100% { transform: rotate(0deg); }
                      40% { transform: rotate(-10deg); }
                      60% { transform: rotate(4deg); }
                    }
                    @keyframes cowEarRight {
                      0%, 100% { transform: rotate(0deg); }
                      35% { transform: rotate(10deg); }
                      70% { transform: rotate(-5deg); }
                    }
                    @keyframes cowJawChew {
                      0%, 100% { transform: translate(0, 0) rotate(0deg); }
                      25% { transform: translate(-3px, 4px) rotate(-4deg); }
                      50% { transform: translate(3px, 3px) rotate(3deg); }
                      75% { transform: translate(-2px, 5px) rotate(-2deg); }
                    }
                    @keyframes grassMunch {
                      0%, 100% { transform: rotate(0deg) translateY(0); }
                      25% { transform: rotate(-12deg) translateY(-2px); }
                      50% { transform: rotate(8deg) translateY(1px); }
                      75% { transform: rotate(-15deg) translateY(-3px); }
                    }
                    @keyframes cowEyeBlink {
                      0%, 88%, 100% { transform: scaleY(1); }
                      94% { transform: scaleY(0.1); }
                    }
                    @keyframes daisySway {
                      0%, 100% { transform: rotate(0deg); }
                      50% { transform: rotate(8deg); }
                    }
                    .cow-body-group {
                      animation: cowBreathe 3.6s ease-in-out infinite;
                      transform-origin: 140px 150px;
                    }
                    .cow-tail {
                      animation: cowTail 2.4s ease-in-out infinite;
                      transform-origin: 220px 85px;
                    }
                    .cow-ear-left {
                      animation: cowEarLeft 3.2s ease-in-out infinite;
                      transform-origin: 82px 55px;
                    }
                    .cow-ear-right {
                      animation: cowEarRight 3.5s ease-in-out infinite;
                      transform-origin: 128px 55px;
                    }
                    .cow-jaw {
                      animation: cowJawChew 1.3s ease-in-out infinite;
                      transform-origin: 95px 95px;
                    }
                    .grass-blade {
                      animation: grassMunch 1.3s ease-in-out infinite;
                      transform-origin: 90px 115px;
                    }
                    .cow-eye {
                      animation: cowEyeBlink 4s ease-in-out infinite;
                      transform-origin: center;
                    }
                    .swaying-daisy {
                      animation: daisySway 2.5s ease-in-out infinite;
                      transform-origin: bottom center;
                    }
                  `}
                </style>

                {/* Ground Shadow */}
                <ellipse cx="145" cy="195" rx="95" ry="12" fill="rgba(15, 61, 36, 0.2)" />

                {/* Entire Breathing Cow Group */}
                <g className="cow-body-group">
                  {/* Tail with Tuft */}
                  <g className="cow-tail">
                    <path
                      d="M218 90 Q240 105 238 135 Q236 150 242 165"
                      stroke="#FFFFFF"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Tail Tuft (brown/dark patch) */}
                    <path
                      d="M242 165 C238 172 240 182 248 184 C252 178 250 170 242 165 Z"
                      fill="#0F3D24"
                    />
                  </g>

                  {/* Back Legs */}
                  <rect x="195" y="120" width="16" height="68" rx="8" fill="#F1F8F5" />
                  <rect x="195" y="180" width="16" height="12" rx="4" fill="#0F3D24" /> {/* Hoof */}

                  <rect x="172" y="115" width="16" height="73" rx="8" fill="#FFFFFF" />
                  <rect x="172" y="180" width="16" height="12" rx="4" fill="#0F3D24" /> {/* Hoof */}

                  {/* Front Legs */}
                  <rect x="95" y="120" width="16" height="68" rx="8" fill="#F1F8F5" />
                  <rect x="95" y="180" width="16" height="12" rx="4" fill="#0F3D24" /> {/* Hoof */}

                  <rect x="74" y="115" width="16" height="73" rx="8" fill="#FFFFFF" />
                  <rect x="74" y="180" width="16" height="12" rx="4" fill="#0F3D24" /> {/* Hoof */}

                  {/* Udder / Milk Vein Highlight */}
                  <ellipse cx="165" cy="138" rx="14" ry="10" fill="#FED7AA" />
                  <circle cx="160" cy="146" r="2.5" fill="#FDBA74" />
                  <circle cx="170" cy="146" r="2.5" fill="#FDBA74" />

                  {/* Main Torso (Friendly rounded cow body) */}
                  <rect x="68" y="70" width="154" height="75" rx="36" fill="#FFFFFF" />
                  {/* Indigenous Hump hint */}
                  <ellipse cx="90" cy="74" rx="20" ry="14" fill="#FFFFFF" />

                  {/* Patches / Spots on body */}
                  <path
                    d="M110 70 C130 70 145 85 140 105 C135 120 115 125 105 110 C98 98 100 75 110 70 Z"
                    fill="#15803D"
                    opacity="0.9"
                  />
                  <path
                    d="M175 75 C195 72 210 88 205 108 C200 120 185 115 178 102 C172 92 165 80 175 75 Z"
                    fill="#0F3D24"
                    opacity="0.85"
                  />
                  <circle cx="150" cy="120" r="9" fill="#15803D" opacity="0.9" />

                  {/* Cow Bell Ribbon & Golden Bell */}
                  <path d="M68 95 Q60 110 75 120" stroke="#DC2626" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  <circle cx="62" cy="116" r="7" fill="#F59E0B" />
                  <circle cx="62" cy="116" r="4.5" fill="#FBBF24" />

                  {/* Neck & Head Base */}
                  <ellipse cx="78" cy="85" rx="22" ry="26" fill="#FFFFFF" />

                  {/* Left Ear */}
                  <g className="cow-ear-left">
                    <ellipse cx="60" cy="50" rx="16" ry="9" fill="#FFFFFF" transform="rotate(-25 60 50)" />
                    <ellipse cx="60" cy="50" rx="11" ry="5.5" fill="#FED7AA" transform="rotate(-25 60 50)" />
                  </g>

                  {/* Right Ear */}
                  <g className="cow-ear-right">
                    <ellipse cx="118" cy="52" rx="16" ry="9" fill="#FFFFFF" transform="rotate(25 118 52)" />
                    <ellipse cx="118" cy="52" rx="11" ry="5.5" fill="#FED7AA" transform="rotate(25 118 52)" />
                  </g>

                  {/* Horns */}
                  <path d="M72 45 Q66 28 58 32 Q68 40 74 46 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
                  <path d="M106 45 Q112 28 120 32 Q110 40 104 46 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Cow Head Front */}
                  <ellipse cx="88" cy="65" rx="28" ry="30" fill="#FFFFFF" />
                  {/* Head Patch */}
                  <path
                    d="M72 42 C82 42 90 52 86 64 C82 72 70 70 66 62 C62 54 66 44 72 42 Z"
                    fill="#0F3D24"
                  />

                  {/* Eyes with Happy Blink Animation */}
                  <g className="cow-eye">
                    <circle cx="75" cy="58" r="4" fill="#0F3D24" />
                    <circle cx="73.5" cy="56.5" r="1.5" fill="#FFFFFF" />
                    <circle cx="102" cy="58" r="4" fill="#0F3D24" />
                    <circle cx="100.5" cy="56.5" r="1.5" fill="#FFFFFF" />
                  </g>

                  {/* Chewing Snout & Jaw Group */}
                  <g className="cow-jaw">
                    {/* Peach Snout */}
                    <ellipse cx="88" cy="88" rx="24" ry="17" fill="#FED7AA" />
                    {/* Nostrils */}
                    <ellipse cx="81" cy="86" rx="3.5" ry="4" fill="#78350F" opacity="0.6" />
                    <ellipse cx="95" cy="86" rx="3.5" ry="4" fill="#78350F" opacity="0.6" />
                    {/* Happy smile line */}
                    <path d="M82 95 Q88 100 94 95" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />

                    {/* GRASS BLADE CHEWING IN MOUTH */}
                    <g className="grass-blade">
                      {/* Main grass blade sticking out */}
                      <path
                        d="M80 94 Q62 90 42 104 Q55 96 78 96"
                        fill="#22C55E"
                        stroke="#16A34A"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M78 94 Q60 84 45 78 Q58 86 76 95"
                        fill="#4ADE80"
                        stroke="#16A34A"
                        strokeWidth="1.2"
                      />
                      {/* Flower on grass stem */}
                      <circle cx="41" cy="104" r="3.5" fill="#FACC15" />
                      <circle cx="41" cy="104" r="2" fill="#EAB308" />
                    </g>
                  </g>
                </g>

                {/* Fresh Grass Tuft under Hooves */}
                <g transform="translate(64, 182)">
                  <path d="M0 12 L4 0 L8 12 L14 2 L18 12" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
                </g>
                <g transform="translate(162, 182)">
                  <path d="M0 12 L5 0 L10 12 L16 1 L20 12" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
                </g>
                {/* Swaying Buttercup Daisy */}
                <g className="swaying-daisy" transform="translate(38, 172)">
                  <path d="M6 20 Q8 10 7 2" stroke="#22C55E" strokeWidth="2.5" fill="none" />
                  <circle cx="7" cy="2" r="4.5" fill="#FACC15" />
                  <circle cx="3" cy="2" r="3" fill="#FFFFFF" />
                  <circle cx="11" cy="2" r="3" fill="#FFFFFF" />
                  <circle cx="7" cy="-2" r="3" fill="#FFFFFF" />
                  <circle cx="7" cy="6" r="3" fill="#FFFFFF" />
                </g>
              </svg>
            </div>

            {/* INSPIRING ANIMAL QUOTE BADGE (Nested directly over pastoral landscape) */}
            <View style={styles.quoteCard}>
              <View style={styles.quoteIconRow}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={styles.quoteTag}>INSPIRATION & HERITAGE</Text>
              </View>
              <Text style={styles.quoteText}>
                “The greatness of a nation and its moral progress can be judged by the way its animals are treated.”
              </Text>
              <View style={styles.quoteAuthorRow}>
                <Text style={styles.quoteAuthor}>— Mahatma Gandhi</Text>
                <View style={styles.quoteSanskritPill}>
                  <Text style={styles.quoteSanskritText}>गावो विश्वस्य मातरः</Text>
                </View>
              </View>
            </View>

            {/* FLOATING MOCKUP CARD 1: WEATHER & AMBIENT TELEMETRY */}
            <View style={styles.mockupWeatherCard}>
              <View style={styles.mockupWeatherLocRow}>
                <MapPin size={13} color={colors.textSecondary} />
                <Text style={styles.mockupWeatherLoc}>Anand, Gujarat</Text>
              </View>
              <View style={styles.mockupTempRow}>
                <Text style={styles.mockupTemp}>+32°C</Text>
                <Sun size={28} color="#F59E0B" />
              </View>
              <View style={styles.mockupWeatherDetails}>
                <Text style={styles.mockupWeatherItem}>💧 72% Hum</Text>
                <Text style={styles.mockupWeatherItem}>💨 6 mph</Text>
                <Text style={styles.mockupWeatherItem}>☀️ Clear</Text>
              </View>
            </View>

            {/* FLOATING MOCKUP CARD 2: AI VISION RECOGNITION STATS */}
            <View style={styles.mockupGrowthCard}>
              <View style={styles.mockupCardHeaderSmall}>
                <Text style={styles.mockupCardTitleSmall}>AI Vision Status</Text>
                <View style={styles.onlineDotPill}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineDotText}>96.8% Top-3</Text>
                </View>
              </View>
              <Text style={styles.growthNumber}>41 ICAR Breeds</Text>
              <Text style={styles.growthSub}>EfficientNet-B0 vision weights loaded</Text>
              {/* Mini Sparkline Bar */}
              <View style={styles.miniBarRow}>
                <View style={[styles.miniBar, { height: 14, backgroundColor: '#86EFAC' }]} />
                <View style={[styles.miniBar, { height: 22, backgroundColor: '#4ADE80' }]} />
                <View style={[styles.miniBar, { height: 18, backgroundColor: '#22C55E' }]} />
                <View style={[styles.miniBar, { height: 28, backgroundColor: '#16A34A' }]} />
                <View style={[styles.miniBar, { height: 34, backgroundColor: colors.primaryDark }]} />
              </View>
            </View>

            {/* FLOATING MOCKUP CARD 3: RECENT VERIFIED ENUMERATION */}
            <View style={styles.mockupTaskCard}>
              <Text style={styles.mockupTaskTitle}>Recent Herd Tag</Text>
              <View style={styles.mockupTaskRow}>
                <Award size={15} color={colors.primary} />
                <Text style={styles.mockupTaskTag}>Gir Cow #PB-10482</Text>
              </View>
              <View style={styles.taskProgressBar}>
                <View style={[styles.taskProgressFill, { width: '84.8%' }]} />
              </View>
              <Text style={styles.mockupTaskSub}>84.8% AI Confirmed • Verified</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= 4. PARTNER / ECOSYSTEM LOGOS RIBBON ================= */}
      <View style={styles.partnersRibbon}>
        <Text style={styles.partnersTitle}>POWERING NATIONAL LIVESTOCK MISSIONS & PARTNERS</Text>
        <View style={styles.partnersRow}>
          <Text style={styles.partnerName}>ICAR-NBAGR</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerName}>BHARAT PASHUDHAN</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerName}>NDDB</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerName}>AMUL COOPERATIVE</Text>
          <Text style={styles.partnerDot}>•</Text>
          <Text style={styles.partnerName}>DAHD GOVT OF INDIA</Text>
        </View>
      </View>

      {/* ================= 5. OVERVIEW & FEATURES ================= */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderCenter}>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>• Overview</Text>
          </View>
          <Text style={styles.sectionMainTitle}>Simplify How You Manage Your Farmland & Herd.</Text>
          <Text style={styles.sectionSubtitle}>
            End field misclassification with state-of-the-art vision models, verified national records,
            direct trading, and 24x7 emergency veterinary assistance.
          </Text>

          {/* Quick filter chips */}
          <View style={styles.chipsRow}>
            {['AI Breed Scanner', 'Zero Hallucination', 'ICAR 41 Breeds', 'Marketplace', '24x7 Pashu Chikitsa'].map((chip, idx) => (
              <View key={chip} style={[styles.chipPill, idx === 0 && styles.chipPillActive]}>
                <Text style={[styles.chipText, idx === 0 && styles.chipTextActive]}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3 Grid Cards */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#EDF9F1' }]}>
              <Camera size={24} color={colors.primary} />
            </View>
            <Text style={styles.featureCardTitle}>Instant Breed Identification</Text>
            <Text style={styles.featureCardDesc}>
              Single-photo inference delivering Top-3 suggestions with calibrated confidence tiers and
              indigenous horn/coat traits in 25ms.
            </Text>
            <TouchableOpacity style={styles.featureCardLink} onPress={() => onNavigate('scan')}>
              <Text style={styles.featureLinkText}>Try Scanner ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Award size={24} color="#D97706" />
            </View>
            <Text style={styles.featureCardTitle}>Direct Livestock Marketplace</Text>
            <Text style={styles.featureCardDesc}>
              Dairy farmers list verified bovines directly with milk yield history, fair pricing,
              and direct inquiry negotiation with traders.
            </Text>
            <TouchableOpacity style={styles.featureCardLink} onPress={() => onNavigate('farmer_marketplace')}>
              <Text style={styles.featureLinkText}>View Listings ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#EAF3FB' }]}>
              <ShieldCheck size={24} color="#0284C7" />
            </View>
            <Text style={styles.featureCardTitle}>24x7 Pashu Chikitsa Network</Text>
            <Text style={styles.featureCardDesc}>
              Instant GPS routing to the nearest government veterinary hospitals, mobile clinics, and
              toll-free emergency 1962 ambulance helpline.
            </Text>
            <TouchableOpacity style={styles.featureCardLink} onPress={() => onNavigate('vets')}>
              <Text style={styles.featureLinkText}>Find Nearest Vet ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= 6. PRICING SECTION ================= */}
      <View style={[styles.sectionContainer, { backgroundColor: '#F8FAF9', borderRadius: 32, paddingVertical: 40 }]}>
        <View style={styles.sectionHeaderCenter}>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>• Pricing</Text>
          </View>
          <Text style={styles.sectionMainTitle}>A Smart Investment for Your Farm.</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the operational plan that best fits your farm size and herd capacity.
          </Text>

          {/* Monthly / Yearly Switch */}
          <View style={styles.pricingSwitch}>
            <TouchableOpacity
              style={[styles.pricingTab, pricingCycle === 'monthly' && styles.pricingTabActive]}
              onPress={() => setPricingCycle('monthly')}
            >
              <Text style={[styles.pricingTabText, pricingCycle === 'monthly' && styles.pricingTabTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pricingTab, pricingCycle === 'yearly' && styles.pricingTabActive]}
              onPress={() => setPricingCycle('yearly')}
            >
              <Text style={[styles.pricingTabText, pricingCycle === 'yearly' && styles.pricingTabTextActive]}>Yearly (Save 20%)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.pricingGrid}>
          {/* Starter Plan */}
          <View style={styles.pricingCard}>
            <Text style={styles.planName}>Starter</Text>
            <Text style={styles.planSub}>Essential tools for small-scale dairy farmers</Text>
            <Text style={styles.planPrice}>Free</Text>
            <Text style={styles.planPriceSub}>Always free for individual farmers</Text>
            <TouchableOpacity
              style={styles.planBtnOutline}
              onPress={() => handleSelectRoleAndEnter('FARMER')}
            >
              <Text style={styles.planBtnOutlineText}>Get Started Free</Text>
            </TouchableOpacity>
            <View style={styles.planFeaturesList}>
              <Text style={styles.planFeatureItem}>✓ Unlimited AI breed scans</Text>
              <Text style={styles.planFeatureItem}>✓ Up to 10 herd records</Text>
              <Text style={styles.planFeatureItem}>✓ Basic marketplace listing</Text>
              <Text style={styles.planFeatureItem}>✓ 24x7 1962 helpline access</Text>
            </View>
          </View>

          {/* Agri Pro Plan (Highlighted as in reference) */}
          <View style={[styles.pricingCard, styles.pricingCardActive]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best value plan ★</Text>
            </View>
            <Text style={styles.planName}>Agri Pro</Text>
            <Text style={styles.planSub}>Advanced features to scale your dairy business</Text>
            <Text style={styles.planPrice}>₹1,499</Text>
            <Text style={styles.planPriceSub}>per month / billed annually</Text>
            <TouchableOpacity
              style={styles.planBtnPrimary}
              onPress={() => handleSelectRoleAndEnter('MIDDLEMAN')}
            >
              <Text style={styles.planBtnPrimaryText}>Start Free Trial</Text>
            </TouchableOpacity>
            <View style={styles.planFeaturesList}>
              <Text style={styles.planFeatureItem}>✓ Real-time multi-herd tracking</Text>
              <Text style={styles.planFeatureItem}>✓ Unlimited trade inquiries</Text>
              <Text style={styles.planFeatureItem}>✓ Harvest & milk yield analytics</Text>
              <Text style={styles.planFeatureItem}>✓ Priority marketplace placement</Text>
              <Text style={styles.planFeatureItem}>✓ 24/7 dedicated support</Text>
            </View>
          </View>

          {/* Enterprise Plan */}
          <View style={styles.pricingCard}>
            <Text style={styles.planName}>Enterprise</Text>
            <Text style={styles.planSub}>Maximum precision for dairy federations & state missions</Text>
            <Text style={styles.planPrice}>Custom</Text>
            <Text style={styles.planPriceSub}>for state departments & co-ops</Text>
            <TouchableOpacity
              style={styles.planBtnOutline}
              onPress={() => handleSelectRoleAndEnter('ADMIN')}
            >
              <Text style={styles.planBtnOutlineText}>Contact State Admin</Text>
            </TouchableOpacity>
            <View style={styles.planFeaturesList}>
              <Text style={styles.planFeatureItem}>✓ All Pro features included</Text>
              <Text style={styles.planFeatureItem}>✓ Custom Bharat Pashudhan API sync</Text>
              <Text style={styles.planFeatureItem}>✓ Multi-district supervisor portal</Text>
              <Text style={styles.planFeatureItem}>✓ Dedicated agricultural consultant</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ================= 7. BOTTOM CTA BANNER ================= */}
      <View style={styles.bottomCtaCard}>
        <View style={styles.bottomCtaLeft}>
          <Text style={styles.bottomCtaTag}>• Get Started</Text>
          <Text style={styles.bottomCtaTitle}>Ready to Transform the Way You Manage Livestock?</Text>
          <Text style={styles.bottomCtaSub}>
            Leave behind manual guesswork. Join thousands of progressive farmers who have switched to
            PashuPehchan and start verifying your herd with full precision.
          </Text>
          <TouchableOpacity
            style={styles.bottomCtaBtn}
            onPress={() => handleOpenAuth('signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomCtaBtnText}>Sign Up Now</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= 8. FOOTER ================= */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <View style={styles.footerBrandRow}>
            <Image
              source={{ uri: '/logo.png' }}
              style={styles.footerLogoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.footerLogoText}>PashuPehchan</Text>
              <Text style={styles.footerLogoSub}>National AI Livestock Breed Verification Platform</Text>
            </View>
          </View>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => onNavigate('breeds')}><Text style={styles.footerLink}>Breeds</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('farmer_marketplace')}><Text style={styles.footerLink}>Marketplace</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('vets')}><Text style={styles.footerLink}>Veterinary</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('system_info')}><Text style={styles.footerLink}>Transparency</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopy}>© 2026 PashuPehchan. Built for National Livestock Mission & ICAR-NBAGR.</Text>
          <Text style={styles.footerContact}>Contact: support@pashupehchan.gov.in • Toll-Free: 1962</Text>
        </View>
      </View>

      {/* ================= 9. LOGIN / SIGNUP DEMO MODAL ================= */}
      {showAuthModal && (
        <Modal
          visible={showAuthModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAuthModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismisser}
              activeOpacity={1}
              onPress={() => setShowAuthModal(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {authMode === 'login' ? 'Welcome Back' : 'Create Free Account'}
                  </Text>
                  <Text style={styles.modalSub}>
                    Choose your role to access the PashuPehchan platform
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAuthModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* 1-Click Role Access Buttons */}
              <Text style={styles.roleSelectionLabel}>SELECT USER WORKSPACE:</Text>
              <View style={styles.roleButtonsList}>
                <TouchableOpacity
                  style={styles.roleCardBtn}
                  onPress={() => handleSelectRoleAndEnter('FARMER')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={{ fontSize: 20 }}>👨‍🌾</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleCardTitle}>Dairy Farmer</Text>
                    <Text style={styles.roleCardSub}>Cattle herd management, AI breed scanning & direct selling</Text>
                  </View>
                  <ArrowRight size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roleCardBtn}
                  onPress={() => handleSelectRoleAndEnter('MIDDLEMAN')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={{ fontSize: 20 }}>🤝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleCardTitle}>Livestock Trader / Middleman</Text>
                    <Text style={styles.roleCardSub}>Wholesale procurement, side-by-side comparison & trade offers</Text>
                  </View>
                  <ArrowRight size={16} color="#D97706" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roleCardBtn}
                  onPress={() => handleSelectRoleAndEnter('ADMIN')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={{ fontSize: 20 }}>🏛️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleCardTitle}>Government / DAHD Supervisor</Text>
                    <Text style={styles.roleCardSub}>Model performance telemetry, audit trail & national standards</Text>
                  </View>
                  <ArrowRight size={16} color="#0284C7" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.guestEnterBtn}
                onPress={() => handleSelectRoleAndEnter('FARMER')}
                activeOpacity={0.8}
              >
                <Text style={styles.guestEnterText}>Enter as Guest / Explore Platform →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F8F5',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  // 1. Floating Top Nav
  navWrapper: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 10,
    zIndex: 100,
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 4px 20px rgba(15, 61, 36, 0.05)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F3D24',
    letterSpacing: -0.3,
  },
  logoSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.8,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF9F1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C2E7D1',
  },
  navPillActiveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  navLink: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  navLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F3D24',
  },
  signupBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    boxShadow: '0 3px 8px rgba(15, 23, 42, 0.2)',
  },
  signupBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 2. Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    marginBottom: 22,
    boxShadow: '0 2px 8px rgba(15, 61, 36, 0.04)',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F3D24',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0F3D24',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
    maxWidth: 720,
    marginBottom: 16,
  },
  heroTitleItalic: {
    color: '#16A34A',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 640,
    marginBottom: 28,
    fontWeight: '500',
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 44,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 2px 8px rgba(15, 61, 36, 0.05)',
  },
  secondaryCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F3D24',
  },
  playIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Centerpiece Dashboard Hero Frame
  dashboardHeroFrame: {
    width: '100%',
    maxWidth: 1020,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(15, 61, 36, 0.08)',
  },
  pastoralCanvas: {
    height: 460,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastoralSvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  animatedCowContainer: {
    position: 'absolute',
    bottom: 25,
    zIndex: 10,
  },

  // Quote Card
  quoteCard: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 8px 24px rgba(15, 61, 36, 0.1)',
    zIndex: 20,
    backdropFilter: 'blur(10px)' as any,
  },
  quoteIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  quoteTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F3D24',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  quoteAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  quoteSanskritPill: {
    backgroundColor: '#EDF9F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  quoteSanskritText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },

  // Mockup Floating Widgets
  mockupWeatherCard: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 8px 20px rgba(15, 61, 36, 0.08)',
    zIndex: 20,
  },
  mockupWeatherLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  mockupWeatherLoc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  mockupTempRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockupTemp: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F3D24',
  },
  mockupWeatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  mockupWeatherItem: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  mockupGrowthCard: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 210,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 8px 20px rgba(15, 61, 36, 0.08)',
    zIndex: 20,
  },
  mockupCardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mockupCardTitleSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  onlineDotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF9F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  onlineDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  growthNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F3D24',
  },
  growthSub: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 34,
  },
  miniBar: {
    flex: 1,
    borderRadius: 4,
  },
  mockupTaskCard: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 8px 20px rgba(15, 61, 36, 0.08)',
    zIndex: 20,
  },
  mockupTaskTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  mockupTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mockupTaskTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F3D24',
  },
  taskProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  mockupTaskSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },

  // 4. Partner Ribbon (Dark wavy band in reference)
  partnersRibbon: {
    backgroundColor: '#0F3D24',
    paddingVertical: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  partnersTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  partnersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  partnerDot: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },

  // 5. Section Base
  sectionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 56,
    maxWidth: 1140,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeaderCenter: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 36,
  },
  sectionPill: {
    backgroundColor: '#EDF9F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  sectionMainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F3D24',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 22,
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chipPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EFE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  featureCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 4px 16px rgba(15, 61, 36, 0.04)',
    gap: 12,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F3D24',
  },
  featureCardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  featureCardLink: {
    marginTop: 6,
  },
  featureLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },

  // 6. Pricing
  pricingSwitch: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    marginTop: 10,
  },
  pricingTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
  },
  pricingTabActive: {
    backgroundColor: '#0F3D24',
  },
  pricingTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pricingTabTextActive: {
    color: '#FFFFFF',
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  pricingCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 4px 16px rgba(15, 61, 36, 0.04)',
    position: 'relative',
  },
  pricingCardActive: {
    borderColor: '#16A34A',
    borderWidth: 2,
    boxShadow: '0 12px 30px rgba(22, 163, 74, 0.15)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F3D24',
    marginBottom: 4,
  },
  planSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    minHeight: 32,
  },
  planPrice: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F3D24',
  },
  planPriceSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
  },
  planBtnOutline: {
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0F3D24',
    alignItems: 'center',
    marginBottom: 24,
  },
  planBtnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F3D24',
  },
  planBtnPrimary: {
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  planBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planFeaturesList: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 18,
  },
  planFeatureItem: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },

  // 7. Bottom CTA Banner
  bottomCtaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    padding: 40,
    maxWidth: 1020,
    alignSelf: 'center',
    width: 'calc(100% - 48px)' as any,
    marginBottom: 60,
    boxShadow: '0 10px 30px rgba(15, 61, 36, 0.05)',
  },
  bottomCtaLeft: {
    maxWidth: 600,
  },
  bottomCtaTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 8,
  },
  bottomCtaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F3D24',
    lineHeight: 36,
    marginBottom: 12,
  },
  bottomCtaSub: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
  },
  bottomCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    alignSelf: 'flex-start',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  bottomCtaBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 8. Footer
  footer: {
    backgroundColor: '#0F3D24',
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 36,
  },
  footerTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    paddingBottom: 28,
    marginBottom: 24,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  footerLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerLogoSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLink: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  footerBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerCopy: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerContact: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // 9. Auth Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 36, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalDismisser: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 500,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 20px 50px rgba(15, 61, 36, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F3D24',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  roleSelectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  roleButtonsList: {
    gap: 12,
    marginBottom: 20,
  },
  roleCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EFE7',
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F3D24',
  },
  roleCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  guestEnterBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestEnterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
});
