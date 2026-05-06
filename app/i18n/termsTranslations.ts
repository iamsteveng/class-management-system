export interface TermsTranslations {
  pageTitle: string;
  pageSubtitle: string;
  purchaseDetails: string;
  customerMobileLabel: string;
  participantsLabel: string;
  classLabel: string;
  classNotSelected: string;
  termsSection: string;
  selectSession: string;
  chooseSession: string;
  participantDetails: string;
  nameLabel: string;
  namePlaceholder: string;
  heightLabel: string;
  heightPlaceholder: string;
  ageLabel: string;
  agePlaceholder: string;
  emergencyContactNameLabel: string;
  emergencyContactNamePlaceholder: string;
  emergencyContactPhoneLabel: string;
  emergencyContactPhonePlaceholder: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  checkboxLabel: string;
  submitButton: string;
  submittingButton: string;
  successHelper: string;
  lockedHelper: string;
  noSessionsHelper: string;
  qrCodeNote: string;
  successHeading: string;
  openQrButton: string;
  missingTokenError: string;
  invalidTokenError: string;
  sessionRequiredError: string;
}

export const termsTranslations: Record<'zh-TW' | 'en', TermsTranslations> = {
  'zh-TW': {
    pageTitle: '接受條款',
    pageSubtitle: '確認你的課程時段並接受條款，以完成報名。',
    purchaseDetails: '訂單詳情',
    customerMobileLabel: '客戶手機號碼',
    participantsLabel: '參加者人數',
    classLabel: '課程',
    classNotSelected: '將根據所選時段確定',
    termsSection: '條款',
    selectSession: '選擇時段',
    chooseSession: '請選擇時段',
    participantDetails: '參加者資料',
    nameLabel: '姓名',
    namePlaceholder: '請輸入你的全名',
    heightLabel: '身高（厘米）',
    heightPlaceholder: '例如：170',
    ageLabel: '年齡（歲）',
    agePlaceholder: '例如：30',
    emergencyContactNameLabel: '緊急聯絡人姓名',
    emergencyContactNamePlaceholder: '全名',
    emergencyContactPhoneLabel: '緊急聯絡人電話',
    emergencyContactPhonePlaceholder: '電話號碼',
    mobileLabel: '手機號碼（含國家碼）',
    mobilePlaceholder: '+852XXXXXXXX',
    email: '電子郵件',
    emailPlaceholder: '請輸入你的電子郵件',
    checkboxLabel: '我已閱讀並接受條款',
    submitButton: '接受條款',
    submittingButton: '提交中...',
    successHelper: '條款已成功接受。',
    lockedHelper: '此訂單的條款已接受。',
    noSessionsHelper: '目前沒有可用名額的時段。',
    qrCodeNote: '確認課程時段並接受條款後，你可在此頁面取得 QR 碼。',
    successHeading: '你的課程申請已確認',
    openQrButton: '開啟你的 QR 碼',
    missingTokenError: '缺少購買 token。請使用 WhatsApp 確認訊息中的完整連結。',
    invalidTokenError: '找不到此 token 對應的有效訂單。',
    sessionRequiredError: '請選擇時段。',
  },
  en: {
    pageTitle: 'Terms Acceptance',
    pageSubtitle: 'Confirm your class session and accept the terms to complete your registration.',
    purchaseDetails: 'Purchase details',
    customerMobileLabel: 'Customer mobile',
    participantsLabel: 'Participants',
    classLabel: 'Class',
    classNotSelected: 'Will be selected based on your chosen session',
    termsSection: 'Terms',
    selectSession: 'Select session',
    chooseSession: 'Choose a session',
    participantDetails: 'Participant details',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    heightLabel: 'Height (cm)',
    heightPlaceholder: 'e.g. 170',
    ageLabel: 'Age (years)',
    agePlaceholder: 'e.g. 30',
    emergencyContactNameLabel: 'Emergency Contact Name',
    emergencyContactNamePlaceholder: 'Full name',
    emergencyContactPhoneLabel: 'Emergency Contact Phone',
    emergencyContactPhonePlaceholder: 'Phone number',
    mobileLabel: 'Mobile number (with country code)',
    mobilePlaceholder: '+852XXXXXXXX',
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    checkboxLabel: 'I have read and accept the terms',
    submitButton: 'Accept Terms',
    submittingButton: 'Submitting...',
    successHelper: 'Terms accepted successfully.',
    lockedHelper: 'Terms have already been accepted for this purchase.',
    noSessionsHelper: 'No sessions currently have available quota.',
    qrCodeNote: 'After confirming your class session and accepting the terms, your QR code will be available on this page.',
    successHeading: 'Your class application is confirmed',
    openQrButton: 'Open your QR Code',
    missingTokenError: 'Missing purchase token. Please use the full link from your WhatsApp confirmation message.',
    invalidTokenError: 'We could not find a valid purchase for this token.',
    sessionRequiredError: 'Please select a session.',
  },
};
