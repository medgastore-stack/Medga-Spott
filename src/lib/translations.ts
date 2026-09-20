export type Language = 'en' | 'ar';

export interface Translations {
  // Navigation
  navHome: string;
  navGames: string;
  navBundles: string;
  navPsPlus: string;
  navVBucks: string;
  navRocket: string;
  navHezo: string;
  navPayment: string;
  navPoints: string;
  navTrackOrder: string;
  navCompare: string;
  navOrders: string;
  navWishlist: string;
  navCart: string;
  navSignIn: string;
  navSignUp: string;
  navLogOut: string;
  navContactSelim: string;
  viewModeLabel: string;
  pageMode: string;
  scrollMode: string;
  searchPlaceholder: string;
  liveChatBtn: string;
  languageBtn: string;

  // Hero
  heroBadge: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBrowseGames: string;
  heroBrowseBundles: string;
  heroCustomerReviews: string;
  heroPointsExplainer: string;
  heroTrustBadges: string[];

  // Games Section
  gamesSectionTitle: string;
  gamesSectionSubtitle: string;
  filterAll: string;
  filterInStock: string;
  filterPreorder: string;
  searchGamesPlaceholder: string;
  clearSearch: string;
  hotBadge: string;
  bestDealBadge: string;
  preorderBadge: string;
  reviewsLabel: string;
  addToCart: string;
  addedToCart: string;
  buyNow: string;
  preorderNow: string;
  selectAccountType: string;
  launchIn: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  viewDetails: string;
  inStockBadge: string;

  // Bundles Section
  bundlesBadge: string;
  bundlesTitle: string;
  bundlesSubtitle: string;
  bundleDealBadge: string;
  bundleCoopDuoTitle: string;
  bundleCoopDuoDesc: string;
  bundleChooseEdition: string;
  bundlePriceOnly: string;
  bundleWasPrice: string;
  bundleSaveAmount: string;
  bundleFeature1: string;
  bundleFeature2: string;
  bundleFeature3: string;
  bundleFeature4: string;
  bundleAddToCart: string;
  bundleBuyNow: string;

  // Account Types
  prim5Title: string;
  prim4Title: string;
  secTitle: string;
  fullTitle: string;
  prim5Short: string;
  prim4Short: string;
  secShort: string;

  // PS Plus
  psPlusBadge: string;
  psPlusTitle: string;
  psPlusSubtitle: string;
  essentialTitle: string;
  extraTitle: string;
  deluxeTitle: string;
  primaryAccount: string;
  secondaryAccount: string;
  month1: string;
  month3: string;
  month12: string;

  // Fortnite & Rocket
  vbucksTitle: string;
  vbucksSubtitle: string;
  rocketTitle: string;
  rocketSubtitle: string;
  rocketPass: string;

  // Hezo
  hezoBadge: string;
  hezoTitle: string;
  hezoSubtitle: string;
  hezoCalculateBtn: string;

  // Points System
  pointsName: string;
  pointsBalanceLabel: string;
  gainedPointsToast: string;
  usePointsForDiscount: string;
  redeemPoints: string;
  discountApplied: string;
  pointsGuideTitle: string;
  pointsGuideSubtitle: string;

  // Checkout
  checkoutTitle: string;
  fullNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  paymentMethodLabel: string;
  paymobLabel: string;
  directTransferLabel: string;
  confirmOrderBtn: string;
  credentialsTitle: string;
  credentialsEmail: string;
  credentialsPassword: string;
  credentialsNote: string;
  orderNotesLabel: string;

  // Contact Selim
  contactOwnerBadge: string;
  contactOwnerTitle: string;
  contactOwnerDesc: string;
  textOnWhatsApp: string;
  ownerName: string;

  // Common
  egp: string;
  pts: string;
  instantDelivery: string;
  guaranteedWarranty: string;
  secureCheckout: string;
  liveSupport: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    navHome: 'Home',
    navGames: 'PlayStation Games',
    navBundles: 'Bundles & Duos',
    navPsPlus: 'PS Plus',
    navVBucks: 'Fortnite V-Bucks',
    navRocket: 'Rocket League',
    navHezo: 'Hezo Boost',
    navPayment: 'Payment',
    navPoints: 'Points',
    navTrackOrder: 'Track Order',
    navCompare: 'Compare Editions',
    navOrders: 'My Orders',
    navWishlist: 'Wishlist',
    navCart: 'Cart',
    navSignIn: 'Sign In',
    navSignUp: 'Sign Up',
    navLogOut: 'Log Out',
    navContactSelim: 'Contact Owner (Selim)',
    viewModeLabel: 'View Mode',
    pageMode: 'Page View',
    scrollMode: 'Scroll View',
    searchPlaceholder: 'Search product...',
    liveChatBtn: 'Chat With Us Live',
    languageBtn: 'العربية',

    heroBadge: '🔥 Egypt’s #1 Gaming Digital Store',
    heroHeadline: 'Instant PS Games, V-Bucks & Subscriptions',
    heroSubtitle: 'Authentic accounts, guaranteed fast delivery via WhatsApp & on-site checkout with Paymob, InstaPay, Vodafone Cash and Telda.',
    heroBrowseGames: 'Browse Games',
    heroBrowseBundles: 'Explore Bundles',
    heroCustomerReviews: 'Customer Reviews',
    heroPointsExplainer: 'Earn points with every purchase: 100 Points = 1 L.E discount!',
    heroTrustBadges: ['⚡ 1–2 Hour Delivery', '🛡️ Lifetime Warranty', '💳 Paymob & InstaPay', '⭐ 4.9/5 Rating'],

    gamesSectionTitle: 'PlayStation Games Collection',
    gamesSectionSubtitle: 'Choose from official primary or secondary accounts with full online multiplayer and trophy sync',
    filterAll: 'All PlayStation Games',
    filterInStock: '⚡ In-Stock (1–2 Hr Delivery)',
    filterPreorder: '⏳ Pre-Orders Vault',
    searchGamesPlaceholder: 'Search games by name or genre...',
    clearSearch: 'Clear',
    hotBadge: 'Hot',
    bestDealBadge: 'Best Deal',
    preorderBadge: 'Pre-Order Reservation',
    reviewsLabel: 'Customer Reviews',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    buyNow: 'Buy Now',
    preorderNow: 'Pre-Order Now',
    selectAccountType: 'Select Account Type',
    launchIn: 'Official Launch In',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Mins',
    seconds: 'Secs',
    viewDetails: 'View Details',
    inStockBadge: 'Instant 1-2 Hr Delivery',

    // Bundles Section
    bundlesBadge: '🔥 Special Value Bundles',
    bundlesTitle: 'Exclusive Game Bundles',
    bundlesSubtitle: 'Get 2 legendary games bundled together for one unbeatable price with primary or secondary access.',
    bundleDealBadge: 'SUPER SAVER BUNDLE',
    bundleCoopDuoTitle: 'It Takes Two x A Way Out Co-Op Bundle',
    bundleCoopDuoDesc: 'The ultimate Hazelight Studios cooperative 2-player bundle! Play two award-winning co-op adventures with a friend. Both games unlocked on one single verified account.',
    bundleChooseEdition: 'Choose your console edition:',
    bundlePriceOnly: 'Special Co-Op Bundle Offer',
    bundleWasPrice: '1,400 L.E',
    bundleSaveAmount: 'Save up to 500 L.E',
    bundleFeature1: 'Both It Takes Two & A Way Out included together',
    bundleFeature2: 'Play online co-op with any friend via Friend\'s Pass',
    bundleFeature3: 'Works on PS5 or PS4 with full trophy support',
    bundleFeature4: 'Fast 1–2 hour delivery with 100% lifetime replacement guarantee',
    bundleAddToCart: 'Add Bundle to Cart',
    bundleBuyNow: 'Buy Bundle Now',

    prim5Title: 'PS5 Primary (Prim 5)',
    prim4Title: 'PS4 Primary (Prim 4)',
    secTitle: 'Secondary (Sec)',
    fullTitle: 'Full Access',
    prim5Short: 'PS5 Primary',
    prim4Short: 'PS4 Primary',
    secShort: 'Secondary',

    psPlusBadge: 'PlayStation Subscriptions',
    psPlusTitle: 'PlayStation Plus Membership',
    psPlusSubtitle: 'Unlock online multiplayer, monthly free games, and catalog access with guaranteed best Egyptian rates.',
    essentialTitle: 'PlayStation Plus Essential',
    extraTitle: 'PlayStation Plus Extra',
    deluxeTitle: 'PlayStation Plus Deluxe',
    primaryAccount: 'Primary Account',
    secondaryAccount: 'Secondary Account',
    month1: '1 Month',
    month3: '3 Months',
    month12: '12 Months',

    vbucksTitle: 'Fortnite V-Bucks',
    vbucksSubtitle: 'Get V-Bucks fast and secure directly to your Epic Games account',
    rocketTitle: 'Rocket League Credits & Pass',
    rocketSubtitle: 'Get credits and Rocket Pass fast and secure directly to your Epic / PSN account',
    rocketPass: 'Rocket Pass',

    hezoBadge: 'Social Media Boosting Engine',
    hezoTitle: 'Hezo Social Services',
    hezoSubtitle: 'Boost your TikTok, Instagram, and YouTube presence with fast, high-quality engagement packages.',
    hezoCalculateBtn: 'Add Boost Service to Cart',

    pointsName: 'Points',
    pointsBalanceLabel: 'Points Balance',
    gainedPointsToast: 'Gained {pts} points!',
    usePointsForDiscount: 'Use Points for Discount',
    redeemPoints: 'Redeem Points',
    discountApplied: 'Discount Applied',
    pointsGuideTitle: 'Points Rewards Guide',
    pointsGuideSubtitle: 'How to earn and spend your points at Medga Store',

    checkoutTitle: 'Complete Your Order',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Phone / WhatsApp Number (Required)',
    emailLabel: 'Email Address',
    paymentMethodLabel: 'Payment Method',
    paymobLabel: 'Paymob (Cards & Mobile Wallets)',
    directTransferLabel: 'Direct Transfer (InstaPay, Vodafone Cash, Telda)',
    confirmOrderBtn: 'Place Order & Get Instant Access',
    credentialsTitle: 'Account Credentials (Required for Fortnite & Rocket League top-up)',
    credentialsEmail: 'Epic Games / Console Email',
    credentialsPassword: 'Epic Games / Console Password',
    credentialsNote: 'Used securely solely to deposit purchased credits directly onto your account.',
    orderNotesLabel: 'Additional Delivery Notes',

    contactOwnerBadge: 'Direct Store Owner Chat',
    contactOwnerTitle: 'Reach Owner',
    contactOwnerDesc: 'Have a special request, inquiry, or custom bulk order? Chat directly with the store owner anytime.',
    textOnWhatsApp: 'Chat Directly with Owner',
    ownerName: 'Selim',

    egp: 'L.E',
    pts: 'Pts',
    instantDelivery: 'Instant Delivery',
    guaranteedWarranty: 'Lifetime Warranty',
    secureCheckout: '100% Secure Checkout',
    liveSupport: '24/7 WhatsApp Support',
  },

  ar: {
    navHome: 'الرئيسية',
    navGames: 'ألعاب بلايستيشن',
    navBundles: 'عروض وحزم الألعاب',
    navPsPlus: 'اشتراكات بلس',
    navVBucks: 'في بوكس فورتنايت',
    navRocket: 'روكت ليق',
    navHezo: 'خدمات هيزو',
    navPayment: 'طرق الدفع',
    navPoints: 'النقاط',
    navTrackOrder: 'تتبع الطلب',
    navCompare: 'مقارنة النسخ',
    navOrders: 'طلباتي',
    navWishlist: 'المفضلة',
    navCart: 'السلة',
    navSignIn: 'تسجيل الدخول',
    navSignUp: 'إنشاء حساب',
    navLogOut: 'تسجيل الخروج',
    navContactSelim: 'تواصل مع سليم (المالك)',
    viewModeLabel: 'طريقة العرض',
    pageMode: 'عرض الصفحات',
    scrollMode: 'تمرير مستمر',
    searchPlaceholder: 'ابحث عن لعبة أو منتج...',
    liveChatBtn: 'تحدث معنا مباشرة',
    languageBtn: 'English',

    heroBadge: '🔥 المتجر رقم 1 للألعاب والخدمات الرقمية في مصر',
    heroHeadline: 'ألعاب بلايستيشن، في بوكس واشتراكات فورية',
    heroSubtitle: 'حسابات أصلية ومضمونة، تسليم سريع وتفعيل فوري عبر الموقع والواتساب مع بايموب، إنستاباي، فودافون كاش وتيلدا.',
    heroBrowseGames: 'تصفح الألعاب',
    heroBrowseBundles: 'استكشف عروض الحزم',
    heroCustomerReviews: 'آراء العملاء',
    heroPointsExplainer: 'اكسب نقاط مع كل عملية شراء: كل 100 نقطة = 1 جنيه خصم!',
    heroTrustBadges: ['⚡ تسليم خلال 1-2 ساعة', '🛡️ ضمان استبدال كامل', '💳 إنستاباي وبايموب', '⭐ تقييم 4.9/5'],

    gamesSectionTitle: 'ألعاب بلايستيشن الرقمية',
    gamesSectionSubtitle: 'حسابات أصلية أساسية وثانوية مع إمكانية اللعب الأونلاين وحفظ التروفيز على جهازك',
    filterAll: 'جميع ألعاب بلايستيشن',
    filterInStock: '⚡ متوفر فوري (تسليم 1-2 ساعة)',
    filterPreorder: '⏳ قسم الطلب المسبق',
    searchGamesPlaceholder: 'ابحث بالاسم أو التصنيف...',
    clearSearch: 'مسح',
    hotBadge: 'شائع',
    bestDealBadge: 'أفضل عرض',
    preorderBadge: 'حجز طلب مسبق',
    reviewsLabel: 'تقييمات العملاء',
    addToCart: 'إضافة للسلة',
    addedToCart: 'تمت الإضافة للسلة',
    buyNow: 'شراء الآن',
    preorderNow: 'طلب مسبق الآن',
    selectAccountType: 'اختر نوع الحساب',
    launchIn: 'موعد الصدور الرسمي خلال',
    days: 'أيام',
    hours: 'ساعات',
    minutes: 'دقائق',
    seconds: 'ثواني',
    viewDetails: 'عرض التفاصيل',
    inStockBadge: 'تسليم فوري خلال 1-2 ساعة',

    // Bundles Section (PlayStation game names remain in English as requested!)
    bundlesBadge: '🔥 عروض الحزم التوفيرية',
    bundlesTitle: 'حزم الألعاب الحصرية',
    bundlesSubtitle: 'احصل على لعبتين أسطوريتين معاً في حساب واحد بسعر مميز لا يقبل المنافسة بحساب أساسي أو ثانوي.',
    bundleDealBadge: 'عرض التوفير الخارق',
    bundleCoopDuoTitle: 'It Takes Two x A Way Out Co-Op Bundle',
    bundleCoopDuoDesc: 'أقوى حزمة ألعاب تعاونية لشخصين من استوديوهات Hazelight! العب أفضل مغامرتين تعاونيتين في تاريخ الألعاب مع صديقك، اللعبتين مفعلتين معاً على حساب رسمي واحد.',
    bundleChooseEdition: 'اختر نوع الحساب لجهازك:',
    bundlePriceOnly: 'عرض حزمة توفيري مميز',
    bundleWasPrice: '1,400 ج.م',
    bundleSaveAmount: 'وفر حتى 500 ج.م',
    bundleFeature1: 'اللعبتان It Takes Two و A Way Out معاً على حساب واحد',
    bundleFeature2: 'اللعب أونلاين مجاناً مع أي صديق عبر بطاقة الصديق Friend\'s Pass',
    bundleFeature3: 'يدعم أجهزة PS5 أو PS4 مع حفظ التروفيز ومراحل اللعب',
    bundleFeature4: 'تسليم سريع خلال 1-2 ساعة مع ضمان مدى الحياة واستبدال فوري',
    bundleAddToCart: 'إضافة الحزمة للسلة',
    bundleBuyNow: 'شراء الحزمة الآن',

    prim5Title: 'حساب أساسي PS5 (برايمري 5)',
    prim4Title: 'حساب أساسي PS4 (برايمري 4)',
    secTitle: 'حساب ثانوي (سكندري)',
    fullTitle: 'حساب كامل (فول أكسس)',
    prim5Short: 'أساسي PS5',
    prim4Short: 'أساسي PS4',
    secShort: 'ثانوي',

    psPlusBadge: 'اشتراكات بلايستيشن بلس',
    psPlusTitle: 'عضوية PlayStation Plus الرسمية',
    psPlusSubtitle: 'استمتع باللعب الجماعي أونلاين، والألعاب الشهرية المجانية ومكتبة الألعاب الضخمة بأفضل أسعار في مصر.',
    essentialTitle: 'بلايستيشن بلس إسنشال (Essential)',
    extraTitle: 'بلايستيشن بلس إكسترا (Extra)',
    deluxeTitle: 'بلايستيشن بلس ديلوكس (Deluxe)',
    primaryAccount: 'حساب أساسي (برايمري)',
    secondaryAccount: 'حساب ثانوي (سكندري)',
    month1: 'شهر واحد',
    month3: '3 أشهر',
    month12: '12 شهر (سنة)',

    vbucksTitle: 'شحن في بوكس فورتنايت (V-Bucks)',
    vbucksSubtitle: 'شحن سريع وآمن للفي بوكس مباشرة على حسابك في Epic Games أو الكونسول',
    rocketTitle: 'كريديتس وباس روكت ليق',
    rocketSubtitle: 'شحن كريديتس وتفعيل الروكت باس مباشرة بأمان وسرعة فائقة',
    rocketPass: 'روكت باس',

    hezoBadge: 'محرك دعم وتزويد السوشيال ميديا',
    hezoTitle: 'خدمات هيزو الرقمية (Hezo Boost)',
    hezoSubtitle: 'ارفع تفاعل حساباتك على تيك توك، إنستغرام ويوتيوب بأعلى جودة وسرعة تنفيذ.',
    hezoCalculateBtn: 'إضافة خدمة الدعم للسلة',

    pointsName: 'النقاط',
    pointsBalanceLabel: 'رصيد النقاط',
    gainedPointsToast: 'حصلت على {pts} نقطة!',
    usePointsForDiscount: 'استبدال النقاط بخصم نقدي',
    redeemPoints: 'استبدال النقاط',
    discountApplied: 'تم تطبيق الخصم',
    pointsGuideTitle: 'دليل نظام النقاط',
    pointsGuideSubtitle: 'كيف تجمع النقاط وتستبدلها بخصومات مباشرة في المتجر',

    checkoutTitle: 'إتمام الطلب والدفع',
    fullNameLabel: 'الاسم بالكامل',
    phoneLabel: 'رقم الهاتف / الواتساب (إجباري للتسليم)',
    emailLabel: 'البريد الإلكتروني',
    paymentMethodLabel: 'طريقة الدفع',
    paymobLabel: 'بايموب (بطاقات بنكية ومحافظ إلكترونية)',
    directTransferLabel: 'تحويل مباشر (إنستاباي، فودافون كاش، تيلدا)',
    confirmOrderBtn: 'تأكيد الطلب واستلام الحساب',
    credentialsTitle: 'بيانات الحساب (مطلوبة لشحن فورتنايت وروكت ليق)',
    credentialsEmail: 'إيميل الحساب (Epic Games / Console)',
    credentialsPassword: 'كلمة سر الحساب',
    credentialsNote: 'تُحفظ بأمان وتُستخدم فقط لشحن الرصيد مباشرة على حسابك.',
    orderNotesLabel: 'ملاحظات إضافية على الطلب',

    contactOwnerBadge: 'محادثة مباشرة مع مالك المتجر',
    contactOwnerTitle: 'تواصل مع المالك (Reach Owner)',
    contactOwnerDesc: 'هل لديك استفسار خاص، طلب غير مدرج، أو تريد طلباً مخصصاً؟ يمكنك التحدث مع مالك المتجر مباشرة.',
    textOnWhatsApp: 'محادثة مالك المتجر عبر واتساب',
    ownerName: 'سليم',

    egp: 'ج.م',
    pts: 'نقطة',
    instantDelivery: 'تسليم فوري 1-2 ساعة',
    guaranteedWarranty: 'ضمان استبدال مدى الحياة',
    secureCheckout: 'دفع آمن 100%',
    liveSupport: 'دعم مباشر عبر واتساب 24/7',
  },
};
