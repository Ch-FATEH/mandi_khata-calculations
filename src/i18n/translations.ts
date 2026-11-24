import { AppLanguage } from '../types/mandi';

export interface Translations {
  appTitle: string;
  defaultShopName: string;
  navHome: string;
  navSales: string;
  navPurchase: string;
  navKhata: string;
  navCalculators: string;
  navReports: string;
  navSettings: string;
  installApp: string;
  installIOS: string;
  iosGuideTitle: string;
  iosGuideStep1: string;
  iosGuideStep2: string;
  offlineBanner: string;
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  update: string;
  delete: string;
  edit: string;
  viewSlip: string;
  print: string;
  search: string;
  all: string;
  today: string;
  thisMonth: string;
  thisYear: string;
  notes: string;
  optional: string;

  // Setup Wizard
  wizardTitle: string;
  wizardStep: string;
  wizardSkip: string;
  wizardBack: string;
  wizardNext: string;
  wizardFinish: string;
  step1Title: string;
  step1Desc: string;
  shopNameUr: string;
  shopNameEn: string;
  taglineLabel: string;
  step2Title: string;
  step2Desc: string;
  ownerLabel: string;
  ownerName: string;
  ownerMobile: string;
  step3Title: string;
  step3Desc: string;
  addressLabel: string;
  cityLabel: string;
  step4Title: string;
  step4Desc: string;
  uploadLogo: string;
  removeLogo: string;
  uploadSignature: string;
  removeSignature: string;
  signatureHint: string;
  step5Title: string;
  step5Desc: string;
  step6Title: string;
  step6Desc: string;

  // Dashboard
  todayAccount: string;
  todaySales: string;
  todayPurchase: string;
  todayCommission: string;
  setCommissionHint: string;
  commissionOffHint: string;
  addSaleBtn: string;
  addPurchaseBtn: string;
  todaySalesWeight: string;
  todayPurchaseWeight: string;
  todayTransactions: string;
  totalRecordsSaved: string;
  quickActions: string;
  commissionCalc: string;
  newSaleSlip: string;
  newPurchaseSlip: string;
  recentTransactions: string;
  emptyDashboardTitle: string;
  emptyDashboardDesc: string;
  kgUnit: string;
  maundUnit: string;
  bagsUnit: string;

  // Sales & Purchase Register
  salesRegisterTitle: string;
  purchaseRegisterTitle: string;
  editSaleTitle: string;
  editPurchaseTitle: string;
  dateLabel: string;
  buyerPartyLabel: string;
  farmerPartyLabel: string;
  partyPlaceholder: string;
  addNewPartyBtn: string;
  cropLabel: string;
  varietyLabel: string;
  varietyPlaceholder: string;
  totalWeightLabel: string;
  bagsLabel: string;
  marginCutLabel: string;
  kandaCutLabel: string;
  ratePerMaundLabel: string;
  advanceLabel: string;
  notesPlaceholder: string;
  liveCalcTitle: string;
  bardanaLabel: string;
  chungiLabel: string;
  netWeightLabel: string;
  maundLabel: string;
  grossAmountLabel: string;
  commissionLabel: string;
  totalMizanLabel: string;
  saveSaleBtn: string;
  savePurchaseBtn: string;
  resetFormBtn: string;
  historyTitle: string;
  filterAllCrops: string;
  filterSearchPlaceholder: string;
  noRecordsFound: string;
  deleteConfirmTitle: string;
  deleteRecordConfirmMsg: string;
  errPartyRequired: string;
  errTotalWeight: string;
  errNegativeNetWeight: string;
  errRateInvalid: string;
  savedToast: string;

  // Party Khata
  khataTitle: string;
  khataSubtitle: string;
  searchPartyPlaceholder: string;
  noPartiesYet: string;
  totalBusiness: string;
  receivableLabel: string;
  payableLabel: string;
  settledLabel: string;
  backToParties: string;
  addPaymentEntry: string;
  jamaOption: string;
  banamOption: string;
  amountRs: string;
  paymentNotePlaceholder: string;
  saveEntry: string;
  colDate: string;
  colParticulars: string;
  colBanam: string;
  colJama: string;
  colBalance: string;
  deletePaymentConfirm: string;

  // Receipt Slip
  salesSlipTitle: string;
  purchaseSlipTitle: string;
  refNoLabel: string;
  partyLabel: string;
  cropVarietyLabel: string;
  bagsCountLabel: string;
  rateLabel: string;
  signatureLabel: string;
  downloadPng: string;
  shareWhatsapp: string;
  copyText: string;
  copiedSuccess: string;

  // Calculators
  calcCentreTitle: string;
  calcSelectPrompt: string;
  calcCommission: string;
  calcSale: string;
  calcPurchase: string;
  calcWeight: string;
  calcMaundKg: string;
  calcRate: string;
  calcTotalAmount: string;
  calcProfit: string;
  calcDiscount: string;
  calcPercentage: string;
  calcAgriExpense: string;

  // Reports
  reportsTitle: string;
  reportSalesTab: string;
  reportPurchaseTab: string;
  reportCropTab: string;
  reportPartyTab: string;
  reportWeightTab: string;
  reportCommissionTab: string;
  reportMizanTab: string;
  fromDate: string;
  toDate: string;
  exportCsv: string;
  periodDaily: string;
  periodMonthly: string;
  periodYearly: string;
  totalCount: string;
  totalWeightSum: string;
  totalGrossSum: string;
  totalCommissionSum: string;
  totalMizanSum: string;
  reportsDisclaimer: string;

  // Settings & Backup
  settingsTitle: string;
  reopenWizard: string;
  shopProfileSection: string;
  calcSettingsSection: string;
  businessSettingsSection: string;
  receiptSettingsSection: string;
  appearanceSection: string;
  backupSection: string;
  commissionPercentLabel: string;
  commissionModeLabel: string;
  commModeSales: string;
  commModePurchase: string;
  commModeBoth: string;
  commModeOff: string;
  maundKgLabel: string;
  bardanaPerBagLabel: string;
  bardanaSalesToggle: string;
  bardanaPurchaseToggle: string;
  chungiPurchaseToggle: string;
  chungiDivisorLabel: string;
  marginSalesToggle: string;
  defaultMarginLabel: string;
  kandaSalesToggle: string;
  kandaPurchaseToggle: string;
  taxLabourNameLabel: string;
  roundAmountsToggle: string;
  maundDecimalsToggle: string;
  cropsManageTitle: string;
  addCropNameUr: string;
  addCropNameEn: string;
  addCropBtn: string;
  varietiesPlaceholder: string;
  receiptHeaderLabel: string;
  receiptFooterLabel: string;
  showPhonesToggle: string;
  showSignatureToggle: string;
  salesPrefixLabel: string;
  salesStartLabel: string;
  purchasePrefixLabel: string;
  purchaseStartLabel: string;
  themeLabel: string;
  lightMode: string;
  darkMode: string;
  languageLabel: string;
  urduLang: string;
  englishLang: string;
  deviceStorageNotice: string;
  exportJsonBtn: string;
  importJsonBtn: string;
  backupPreviewTitle: string;
  backupRecordsSummary: string;
  mergeBackupBtn: string;
  replaceBackupBtn: string;
  backupInvalidError: string;
  backupSuccessMsg: string;
  settingsSavedNote: string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  ur: {
    appTitle: 'منڈی کھاتہ',
    defaultShopName: 'منڈی کھاتہ کمیشن شاپ',
    navHome: 'ہوم',
    navSales: 'فروخت',
    navPurchase: 'خرید',
    navKhata: 'کھاتہ',
    navCalculators: 'کیلکولیٹر',
    navReports: 'رپورٹس',
    navSettings: 'سیٹنگز',
    installApp: 'ایپ انسٹال کریں',
    installIOS: 'آئی فون پر انسٹال',
    iosGuideTitle: 'آئی فون / آئی پیڈ پر انسٹال کریں',
    iosGuideStep1: 'سفاری میں نیچے شیئر (Share) بٹن دبائیں۔',
    iosGuideStep2: 'نیچے سکرول کر کے "Add to Home Screen" منتخب کریں۔',
    offlineBanner: 'آف لائن موڈ — تمام ریکارڈ ڈیوائس پر محفوظ ہو رہے ہیں',
    close: 'بند کریں',
    cancel: 'منسوخ',
    confirm: 'تصدیق کریں',
    save: 'محفوظ کریں',
    update: 'اپڈیٹ کریں',
    delete: 'حذف کریں',
    edit: 'ترمیم',
    viewSlip: 'پرچی دیکھیں',
    print: 'پرنٹ',
    search: 'تلاش',
    all: 'تمام',
    today: 'آج',
    thisMonth: 'اس ماہ',
    thisYear: 'اس سال',
    notes: 'نوٹس',
    optional: 'اختیاری',

    wizardTitle: 'دکان کا ابتدائی سیٹ اپ',
    wizardStep: 'مرحلہ',
    wizardSkip: 'ابھی چھوڑیں',
    wizardBack: 'واپس',
    wizardNext: 'اگلا',
    wizardFinish: 'مکمل کریں',
    step1Title: 'دکان کا نام اور تعارف',
    step1Desc: 'اپنی کمیشن شاپ کا اردو اور انگریزی نام درج کریں جو پرچی اور ہیڈر پر آئے گا۔',
    shopNameUr: 'دکان کا نام (اردو)',
    shopNameEn: 'دکان کا نام (انگریزی)',
    taglineLabel: 'ٹیگ لائن / ذیلی عبارت',
    step2Title: 'مالکان کی تفصیلات',
    step2Desc: 'زیادہ سے زیادہ 3 مالکان کے نام اور موبائل نمبر درج کریں (اختیاری)۔',
    ownerLabel: 'مالک',
    ownerName: 'نام',
    ownerMobile: 'موبائل نمبر',
    step3Title: 'دکان کا پتہ',
    step3Desc: 'مکمل پتہ اور شہر درج کریں جو پرچی کے نیچے پرنٹ ہوگا۔',
    addressLabel: 'مکمل پتہ',
    cityLabel: 'شہر / ضلع',
    step4Title: 'لوگو اور دستخط',
    step4Desc: 'اپنی دکان کا لوگو اور دستخط کی تصویر اپلوڈ کریں (اختیاری)۔',
    uploadLogo: 'لوگو منتخب کریں',
    removeLogo: 'لوگو ہٹائیں',
    uploadSignature: 'دستخط منتخب کریں',
    removeSignature: 'دستخط ہٹائیں',
    signatureHint: 'دستخط نہ ہونے پر پرچی پر خالی لکیر دکھائی جائے گی۔',
    step5Title: 'حساب کتاب کے اصول',
    step5Desc: 'کمیشن، من کا وزن، باردانہ اور چونگی کی سیٹنگز طے کریں۔',
    step6Title: 'سیٹ اپ مکمل ہے',
    step6Desc: 'اب آپ کی دکان کا رجسٹر استعمال کے لیے تیار ہے۔ آپ کسی بھی وقت سیٹنگز بدل سکتے ہیں۔',

    todayAccount: 'آج کا حساب',
    todaySales: 'آج کی فروخت',
    todayPurchase: 'آج کی خرید',
    todayCommission: 'آج کا کمیشن',
    setCommissionHint: 'سیٹنگز میں کمیشن فیصد درج کریں',
    commissionOffHint: 'سیٹنگز میں کمیشن کٹوتی بند ہے',
    addSaleBtn: 'فروخت درج کریں',
    addPurchaseBtn: 'خرید درج کریں',
    todaySalesWeight: 'آج کا فروخت وزن',
    todayPurchaseWeight: 'آج کا خرید وزن',
    todayTransactions: 'آج کے سودے',
    totalRecordsSaved: 'کل محفوظ ریکارڈ',
    quickActions: 'فوری سہولیات',
    commissionCalc: 'کمیشن کیلکولیٹر',
    newSaleSlip: 'نئی فروخت پرچی',
    newPurchaseSlip: 'نئی خرید پرچی',
    recentTransactions: 'حالیہ لین دین',
    emptyDashboardTitle: 'ابھی کوئی ریکارڈ درج نہیں',
    emptyDashboardDesc: 'اپنی منڈی کا پہلا سودا درج کرنے کے لیے نیچے فروخت یا خرید کا بٹن دبائیں۔',
    kgUnit: 'کلو',
    maundUnit: 'من',
    bagsUnit: 'بوری',

    salesRegisterTitle: 'فروخت رجسٹر',
    purchaseRegisterTitle: 'خرید رجسٹر',
    editSaleTitle: 'فروخت میں ترمیم',
    editPurchaseTitle: 'خرید میں ترمیم',
    dateLabel: 'تاریخ',
    buyerPartyLabel: 'پارٹی / رائس مل کا نام',
    farmerPartyLabel: 'پارٹی / زمیندار کا نام',
    partyPlaceholder: 'پارٹی کا نام لکھیں یا منتخب کریں',
    addNewPartyBtn: 'نئی پارٹی شامل کریں',
    cropLabel: 'جنس / فصل',
    varietyLabel: 'قسم / ورائٹی',
    varietyPlaceholder: 'قسم منتخب کریں یا خود لکھیں',
    totalWeightLabel: 'کل وزن (کلوگرام)',
    bagsLabel: 'تعداد بوری',
    marginCutLabel: 'مارجن کاٹ (کلوگرام)',
    kandaCutLabel: 'کنڈہ کاٹ (کلوگرام)',
    ratePerMaundLabel: 'ریٹ فی من (روپے)',
    advanceLabel: 'بیعانہ / پیشگی (روپے)',
    notesPlaceholder: 'گاڑی نمبر یا اضافی تفصیل...',
    liveCalcTitle: 'لائیو حساب',
    bardanaLabel: 'باردانہ کاٹ',
    chungiLabel: 'چونگی',
    netWeightLabel: 'صافی وزن',
    maundLabel: 'کل من',
    grossAmountLabel: 'کل رقم',
    commissionLabel: 'کمیشن',
    totalMizanLabel: 'ٹوٹل میزان',
    saveSaleBtn: 'فروخت محفوظ کریں',
    savePurchaseBtn: 'خرید محفوظ کریں',
    resetFormBtn: 'نیا اندراج',
    historyTitle: 'محفوظ ریکارڈز',
    filterAllCrops: 'تمام اجناس',
    filterSearchPlaceholder: 'پارٹی، جنس، قسم یا حوالہ نمبر سے تلاش کریں...',
    noRecordsFound: 'اس فلٹر کے مطابق کوئی ریکارڈ نہیں ملا۔',
    deleteConfirmTitle: 'ریکارڈ حذف کرنے کی تصدیق',
    deleteRecordConfirmMsg: 'کیا آپ واقعی یہ ریکارڈ مستقل طور پر حذف کرنا چاہتے ہیں؟ پرچی نمبر دوبارہ استعمال نہیں ہوگا۔',
    errPartyRequired: 'براہ کرم پارٹی کا نام درج کریں۔',
    errTotalWeight: 'براہ کرم درست کل وزن درج کریں۔',
    errNegativeNetWeight: 'صافی وزن منفی نہیں ہو سکتا! کٹوتیاں کل وزن سے زیادہ ہیں۔',
    errRateInvalid: 'براہ کرم ریٹ فی من درج کریں۔',
    savedToast: 'ریکارڈ کامیابی سے محفوظ ہو گیا',

    khataTitle: 'پارٹی کھاتہ لیجر',
    khataSubtitle: 'تمام خریداروں اور زمینداروں کا لین دین اور بقایہ جات',
    searchPartyPlaceholder: 'پارٹی کا نام تلاش کریں...',
    noPartiesYet: 'ابھی کسی پارٹی کا ریکارڈ موجود نہیں۔ فروخت یا خرید درج کرنے پر کھاتہ خود بخود بن جائے گا۔',
    totalBusiness: 'کل کاروبار',
    receivableLabel: 'وصولی (بنام)',
    payableLabel: 'ادائیگی (جمع)',
    settledLabel: 'حساب برابر',
    backToParties: 'تمام پارٹیاں',
    addPaymentEntry: 'نقد / بینک اندراج (جمع / بنام)',
    jamaOption: 'جمع (وصولی)',
    banamOption: 'بنام (ادائیگی)',
    amountRs: 'رقم (روپے)',
    paymentNotePlaceholder: 'تفصیل مثلاً نقد یا بینک ٹرانسفر...',
    saveEntry: 'اندراج محفوظ کریں',
    colDate: 'تاریخ',
    colParticulars: 'تفصیل',
    colBanam: 'بنام',
    colJama: 'جمع',
    colBalance: 'میزان / بقایا',
    deletePaymentConfirm: 'کیا آپ واقعی یہ نقد اندراج حذف کرنا چاہتے ہیں؟',

    salesSlipTitle: 'فروخت پرچی',
    purchaseSlipTitle: 'خرید پرچی',
    refNoLabel: 'حوالہ نمبر',
    partyLabel: 'پارٹی',
    cropVarietyLabel: 'جنس / قسم',
    bagsCountLabel: 'تعداد بوری',
    rateLabel: 'ریٹ فی من',
    signatureLabel: 'دستخط',
    downloadPng: 'PNG ڈاؤن لوڈ',
    shareWhatsapp: 'واٹس ایپ شیئر',
    copyText: 'ٹیکسٹ کاپی',
    copiedSuccess: 'تفصیل کاپی ہو گئی',

    calcCentreTitle: 'منڈی کیلکولیٹر سینٹر',
    calcSelectPrompt: 'حساب کتاب کے لیے کیلکولیٹر منتخب کریں',
    calcCommission: 'کمیشن کیلکولیٹر',
    calcSale: 'فروخت کیلکولیٹر',
    calcPurchase: 'خرید کیلکولیٹر',
    calcWeight: 'وزن اور بوری کیلکولیٹر',
    calcMaundKg: 'من اور کلو کنورٹر',
    calcRate: 'ریٹ کیلکولیٹر',
    calcTotalAmount: 'کل رقم کیلکولیٹر',
    calcProfit: 'نفع کیلکولیٹر',
    calcDiscount: 'رعایت (ڈسکاؤنٹ) کیلکولیٹر',
    calcPercentage: 'فیصد کیلکولیٹر',
    calcAgriExpense: 'زرعی اخراجات کیلکولیٹر',

    reportsTitle: 'رپورٹس اور خلاصہ',
    reportSalesTab: 'فروخت رپورٹ',
    reportPurchaseTab: 'خرید رپورٹ',
    reportCropTab: 'جنس کے لحاظ سے',
    reportPartyTab: 'پارٹی کے لحاظ سے',
    reportWeightTab: 'وزن رپورٹ',
    reportCommissionTab: 'کمیشن رپورٹ',
    reportMizanTab: 'ٹوٹل میزان رپورٹ',
    fromDate: 'از تاریخ',
    toDate: 'تا تاریخ',
    exportCsv: 'CSV ڈاؤن لوڈ',
    periodDaily: 'روزانہ',
    periodMonthly: 'ماہانہ',
    periodYearly: 'سالانہ',
    totalCount: 'کل تعداد',
    totalWeightSum: 'کل صافی وزن',
    totalGrossSum: 'کل رقم',
    totalCommissionSum: 'کل کمیشن',
    totalMizanSum: 'ٹوٹل میزان',
    reportsDisclaimer: 'فروخت اور خرید کے اعداد و شمار الگ الگ دکھائے گئے ہیں؛ اصل منافع اخراجات اور اسٹاک کے مطابق مختلف ہوتا ہے۔',

    settingsTitle: 'دکان اور حساب کتاب کی سیٹنگز',
    reopenWizard: 'سیٹ اپ وزرڈ دوبارہ چلائیں',
    shopProfileSection: 'دکان کی تفصیلات',
    calcSettingsSection: 'حساب اور کٹوتی کے اصول',
    businessSettingsSection: 'اجناس اور اقسام',
    receiptSettingsSection: 'پرچی اور حوالہ نمبر',
    appearanceSection: 'تھیم اور زبان',
    backupSection: 'بیک اپ اور ڈیٹا محفوظی',
    commissionPercentLabel: 'کمیشن شرح (%)',
    commissionModeLabel: 'کمیشن کہاں لاگو ہو',
    commModeSales: 'صرف فروخت میں',
    commModePurchase: 'صرف خرید میں',
    commModeBoth: 'فروخت اور خرید دونوں میں',
    commModeOff: 'بند (0)',
    maundKgLabel: '1 من برابر کلوگرام',
    bardanaPerBagLabel: 'باردانہ فی بوری (کلو)',
    bardanaSalesToggle: 'فروخت میں باردانہ لاگو کریں',
    bardanaPurchaseToggle: 'خرید میں باردانہ لاگو کریں',
    chungiPurchaseToggle: 'خرید میں چونگی لاگو کریں',
    chungiDivisorLabel: 'چونگی تقسیم کار (ڈیفالٹ 2)',
    marginSalesToggle: 'فروخت میں مارجن کاٹ فعال کریں',
    defaultMarginLabel: 'ڈیفالٹ مارجن کاٹ (کلو)',
    kandaSalesToggle: 'فروخت میں کنڈہ کاٹ فعال کریں',
    kandaPurchaseToggle: 'خرید میں کنڈہ کاٹ فعال کریں',
    taxLabourNameLabel: 'ٹیکس / مزدوری کا عنوان',
    roundAmountsToggle: 'رقم کو پورے روپے میں راؤنڈ کریں',
    maundDecimalsToggle: 'من کو 2 اعشاریہ تک دکھائیں',
    cropsManageTitle: 'اجناس کی فہرست',
    addCropNameUr: 'جنس کا اردو نام',
    addCropNameEn: 'جنس کا انگریزی نام',
    addCropBtn: 'جنس شامل کریں',
    varietiesPlaceholder: 'اقسام کوما سے الگ کر کے لکھیں (مثلاً 1509, 1121)',
    receiptHeaderLabel: 'پرچی ہیڈر لائن',
    receiptFooterLabel: 'پرچی فوٹر پتہ',
    showPhonesToggle: 'پرچی پر مالکان کے نمبر دکھائیں',
    showSignatureToggle: 'پرچی پر دستخط دکھائیں',
    salesPrefixLabel: 'فروخت حوالہ حروف',
    salesStartLabel: 'فروخت شروعاتی نمبر',
    purchasePrefixLabel: 'خرید حوالہ حروف',
    purchaseStartLabel: 'خرید شروعاتی نمبر',
    themeLabel: 'ڈسپلے موڈ',
    lightMode: 'روشن (لائٹ)',
    darkMode: 'تاریک (ڈارک)',
    languageLabel: 'زبان منتخب کریں',
    urduLang: 'اردو',
    englishLang: 'English',
    deviceStorageNotice: 'آپ کا تمام ڈیٹا صرف اسی ڈیوائس پر محفوظ ہے۔ موبائل تبدیل کرنے یا براؤزر ڈیٹا صاف کرنے سے پہلے JSON بیک اپ ضرور ڈاؤن لوڈ کریں۔',
    exportJsonBtn: 'JSON بیک اپ ڈاؤن لوڈ کریں',
    importJsonBtn: 'JSON بیک اپ فائل منتخب کریں',
    backupPreviewTitle: 'بیک اپ فائل کا جائزہ',
    backupRecordsSummary: 'فروخت ریکارڈز، خرید ریکارڈز اور کھاتہ اندراجات پائے گئے۔',
    mergeBackupBtn: 'موجودہ ڈیٹا میں ضم کریں (Merge)',
    replaceBackupBtn: 'پرانا ڈیٹا بدل دیں (Replace)',
    backupInvalidError: 'یہ بیک اپ فائل درست نہیں ہے۔',
    backupSuccessMsg: 'بیک اپ کامیابی سے بحال ہو گیا۔',
    settingsSavedNote: 'تبدیلیاں فوری طور پر محفوظ اور نئے حسابات پر لاگو ہو جاتی ہیں۔ پرانے محفوظ ریکارڈز اپنی اصل رقم پر برقرار رہتے ہیں۔',
  },
  en: {
    appTitle: 'Mandi Khata',
    defaultShopName: 'Mandi Khata Commission Shop',
    navHome: 'Home',
    navSales: 'Sales',
    navPurchase: 'Purchase',
    navKhata: 'Khata',
    navCalculators: 'Calculators',
    navReports: 'Reports',
    navSettings: 'Settings',
    installApp: 'Install App',
    installIOS: 'Install on iOS',
    iosGuideTitle: 'Install on iPhone / iPad',
    iosGuideStep1: 'Tap the Share button in the Safari toolbar.',
    iosGuideStep2: 'Scroll down and tap "Add to Home Screen".',
    offlineBanner: 'Offline Mode — All records are safely stored on your device',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    update: 'Update',
    delete: 'Delete',
    edit: 'Edit',
    viewSlip: 'View Slip',
    print: 'Print',
    search: 'Search',
    all: 'All',
    today: 'Today',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    notes: 'Notes',
    optional: 'Optional',

    wizardTitle: 'Commission Shop Setup',
    wizardStep: 'Step',
    wizardSkip: 'Skip for Now',
    wizardBack: 'Back',
    wizardNext: 'Next',
    wizardFinish: 'Finish Setup',
    step1Title: 'Shop Name & Identity',
    step1Desc: 'Enter your shop name in Urdu and English for the header and printed slips.',
    shopNameUr: 'Shop Name (Urdu)',
    shopNameEn: 'Shop Name (English)',
    taglineLabel: 'Tagline / Subtitle',
    step2Title: 'Shop Owners',
    step2Desc: 'Add up to 3 owners with their mobile numbers (all optional, editable anytime).',
    ownerLabel: 'Owner',
    ownerName: 'Full Name',
    ownerMobile: 'Mobile Number',
    step3Title: 'Shop Address',
    step3Desc: 'Enter full shop address and city/district for slip footers.',
    addressLabel: 'Full Address',
    cityLabel: 'City / District',
    step4Title: 'Logo & Signature',
    step4Desc: 'Upload your shop logo and owner signature image locally (optional).',
    uploadLogo: 'Upload Logo',
    removeLogo: 'Remove Logo',
    uploadSignature: 'Upload Signature',
    removeSignature: 'Remove Signature',
    signatureHint: 'Without a signature image, slips display a clean blank signature line.',
    step5Title: 'Calculation Rules',
    step5Desc: 'Configure commission %, maund weight, bardana, and chungi defaults.',
    step6Title: 'Ready to Start',
    step6Desc: 'Your commission shop register is configured. You can change any setting anytime.',

    todayAccount: "Today's Summary",
    todaySales: "Today's Sales",
    todayPurchase: "Today's Purchase",
    todayCommission: "Today's Commission",
    setCommissionHint: 'Set commission % in Settings',
    commissionOffHint: 'Commission deduction is OFF in Settings',
    addSaleBtn: 'Add Sale Entry',
    addPurchaseBtn: 'Add Purchase Entry',
    todaySalesWeight: "Today's Sales Weight",
    todayPurchaseWeight: "Today's Purchase Weight",
    todayTransactions: "Today's Deals",
    totalRecordsSaved: 'Total Saved Records',
    quickActions: 'Quick Actions',
    commissionCalc: 'Commission Calculator',
    newSaleSlip: 'New Sale Slip',
    newPurchaseSlip: 'New Purchase Slip',
    recentTransactions: 'Recent Transactions',
    emptyDashboardTitle: 'No Records Saved Yet',
    emptyDashboardDesc: 'Record your first grain market transaction using the Add Sale or Add Purchase buttons above.',
    kgUnit: 'KG',
    maundUnit: 'Maund',
    bagsUnit: 'Bags',

    salesRegisterTitle: 'Sales Register',
    purchaseRegisterTitle: 'Purchase Register',
    editSaleTitle: 'Edit Sale Record',
    editPurchaseTitle: 'Edit Purchase Record',
    dateLabel: 'Date',
    buyerPartyLabel: 'Party / Rice Mill Name',
    farmerPartyLabel: 'Party / Farmer Name',
    partyPlaceholder: 'Type or select party name',
    addNewPartyBtn: 'Add New Party',
    cropLabel: 'Crop / Commodity',
    varietyLabel: 'Variety',
    varietyPlaceholder: 'Select or enter variety',
    totalWeightLabel: 'Total Weight (KG)',
    bagsLabel: 'Number of Bags',
    marginCutLabel: 'Margin Cut (KG)',
    kandaCutLabel: 'Kanda Cut (KG)',
    ratePerMaundLabel: 'Rate per Maund (Rs)',
    advanceLabel: 'Advance (Rs)',
    notesPlaceholder: 'Vehicle no. or remarks...',
    liveCalcTitle: 'Live Calculation',
    bardanaLabel: 'Bardana Cut',
    chungiLabel: 'Chungi',
    netWeightLabel: 'Net Weight',
    maundLabel: 'Maund',
    grossAmountLabel: 'Gross Amount',
    commissionLabel: 'Commission',
    totalMizanLabel: 'Total Mizan',
    saveSaleBtn: 'Save Sale',
    savePurchaseBtn: 'Save Purchase',
    resetFormBtn: 'New Entry',
    historyTitle: 'Saved Records',
    filterAllCrops: 'All Crops',
    filterSearchPlaceholder: 'Search by party, crop, variety, or ref no...',
    noRecordsFound: 'No matching records found.',
    deleteConfirmTitle: 'Confirm Delete Record',
    deleteRecordConfirmMsg: 'Are you sure you want to permanently delete this record? Its reference number will never be reused.',
    errPartyRequired: 'Please enter a party name.',
    errTotalWeight: 'Please enter a valid total weight.',
    errNegativeNetWeight: 'Net weight cannot be negative! Deductions exceed total weight.',
    errRateInvalid: 'Please enter a valid rate per maund.',
    savedToast: 'Record saved successfully',

    khataTitle: 'Party Khata Ledger',
    khataSubtitle: 'Party-wise transactions, advances, payments, and running balances',
    searchPartyPlaceholder: 'Search party name...',
    noPartiesYet: 'No party accounts yet. Parties appear automatically once you save a sale or purchase.',
    totalBusiness: 'Total Business',
    receivableLabel: 'Receivable',
    payableLabel: 'Payable',
    settledLabel: 'Settled',
    backToParties: 'All Parties',
    addPaymentEntry: 'Add Cash / Bank Entry',
    jamaOption: 'Jama (Received)',
    banamOption: 'Banam (Paid)',
    amountRs: 'Amount (Rs)',
    paymentNotePlaceholder: 'Payment note, e.g., cash or bank transfer...',
    saveEntry: 'Save Entry',
    colDate: 'Date',
    colParticulars: 'Particulars',
    colBanam: 'Banam (Debit)',
    colJama: 'Jama (Credit)',
    colBalance: 'Balance',
    deletePaymentConfirm: 'Are you sure you want to delete this payment entry?',

    salesSlipTitle: 'Sales Slip',
    purchaseSlipTitle: 'Purchase Slip',
    refNoLabel: 'Ref No',
    partyLabel: 'Party',
    cropVarietyLabel: 'Crop / Variety',
    bagsCountLabel: 'Bags',
    rateLabel: 'Rate / Maund',
    signatureLabel: 'Signature',
    downloadPng: 'Download PNG',
    shareWhatsapp: 'Share WhatsApp',
    copyText: 'Copy Summary',
    copiedSuccess: 'Summary copied to clipboard',

    calcCentreTitle: 'Calculator Centre',
    calcSelectPrompt: 'Choose a calculator reading your live shop settings',
    calcCommission: 'Commission Calculator',
    calcSale: 'Sale Calculator',
    calcPurchase: 'Purchase Calculator',
    calcWeight: 'Weight & Bags Calculator',
    calcMaundKg: 'Maund ↔ KG Converter',
    calcRate: 'Rate Calculator',
    calcTotalAmount: 'Total Amount Calculator',
    calcProfit: 'Profit Calculator',
    calcDiscount: 'Discount Calculator',
    calcPercentage: 'Percentage Calculator',
    calcAgriExpense: 'Agri Expense Calculator',

    reportsTitle: 'Reports & Analytics',
    reportSalesTab: 'Sales Report',
    reportPurchaseTab: 'Purchase Report',
    reportCropTab: 'Crop-wise',
    reportPartyTab: 'Party-wise',
    reportWeightTab: 'Weight Report',
    reportCommissionTab: 'Commission',
    reportMizanTab: 'Total Mizan',
    fromDate: 'From Date',
    toDate: 'To Date',
    exportCsv: 'Export CSV',
    periodDaily: 'Daily',
    periodMonthly: 'Monthly',
    periodYearly: 'Yearly',
    totalCount: 'Records',
    totalWeightSum: 'Net Weight',
    totalGrossSum: 'Gross Amount',
    totalCommissionSum: 'Commission',
    totalMizanSum: 'Total Mizan',
    reportsDisclaimer: 'Sales and Purchase totals are reported separately and never subtracted to imply net profit.',

    settingsTitle: 'Shop & Calculation Settings',
    reopenWizard: 'Re-open Setup Wizard',
    shopProfileSection: 'Shop Profile',
    calcSettingsSection: 'Calculation Rules',
    businessSettingsSection: 'Crops & Varieties',
    receiptSettingsSection: 'Receipt & Reference Series',
    appearanceSection: 'Theme & Language',
    backupSection: 'Backup & Restore',
    commissionPercentLabel: 'Commission Percentage (%)',
    commissionModeLabel: 'Apply Commission In',
    commModeSales: 'Sales Only',
    commModePurchase: 'Purchase Only',
    commModeBoth: 'Both Sales & Purchase',
    commModeOff: 'Off',
    maundKgLabel: '1 Maund in KG',
    bardanaPerBagLabel: 'Bardana per Bag (KG)',
    bardanaSalesToggle: 'Apply Bardana in Sales',
    bardanaPurchaseToggle: 'Apply Bardana in Purchase',
    chungiPurchaseToggle: 'Apply Chungi in Purchase',
    chungiDivisorLabel: 'Chungi Divisor (default 2)',
    marginSalesToggle: 'Enable Margin Cut in Sales',
    defaultMarginLabel: 'Default Margin Cut (KG)',
    kandaSalesToggle: 'Enable Kanda Cut in Sales',
    kandaPurchaseToggle: 'Enable Kanda Cut in Purchase',
    taxLabourNameLabel: 'Bank Tax / Labour Label',
    roundAmountsToggle: 'Round Amounts to Whole Rupee',
    maundDecimalsToggle: 'Display Maund to 2 Decimals',
    cropsManageTitle: 'Crop & Variety List',
    addCropNameUr: 'Crop Name (Urdu)',
    addCropNameEn: 'Crop Name (English)',
    addCropBtn: 'Add Crop',
    varietiesPlaceholder: 'Comma-separated varieties (e.g., 1509, 1121)',
    receiptHeaderLabel: 'Receipt Header Tagline',
    receiptFooterLabel: 'Receipt Footer Address',
    showPhonesToggle: "Show Owners' Mobile Numbers on Slip",
    showSignatureToggle: 'Show Signature Block on Slip',
    salesPrefixLabel: 'Sales Ref Prefix',
    salesStartLabel: 'Sales Starting Number',
    purchasePrefixLabel: 'Purchase Ref Prefix',
    purchaseStartLabel: 'Purchase Starting Number',
    themeLabel: 'Display Theme',
    lightMode: 'Light',
    darkMode: 'Dark',
    languageLabel: 'Interface Language',
    urduLang: 'اردو',
    englishLang: 'English',
    deviceStorageNotice: 'Your data is stored only on this device. Take a JSON backup before changing phone or clearing browser data.',
    exportJsonBtn: 'Download JSON Backup',
    importJsonBtn: 'Select JSON Backup File',
    backupPreviewTitle: 'Backup File Preview',
    backupRecordsSummary: 'sales records, purchase records, and ledger entries found.',
    mergeBackupBtn: 'Merge with Existing Data',
    replaceBackupBtn: 'Replace All Data',
    backupInvalidError: 'The selected file is not a valid Mandi Khata backup.',
    backupSuccessMsg: 'Backup restored successfully.',
    settingsSavedNote: 'Changes apply immediately to all future calculations. Saved old records retain their original values.',
  },
};
