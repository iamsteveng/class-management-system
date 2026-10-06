export interface AttendanceQrTranslations {
  reminder: string;
  scanForDetails: string;
  qrAlt: string;
  saveButton: string;
  savingButton: string;
  saveFailed: string;
  imageReminder: string;
  imageFileName: string;
  mapButton: string;
  resaveNotice: string;
}

export const attendanceQrTranslations: Record<'zh-TW' | 'en', AttendanceQrTranslations> = {
  'zh-TW': {
    reminder: '請儲存或截圖此 QR 碼，並保留至上課當日。報到時請出示。',
    scanForDetails: '掃描 QR 碼查看詳情',
    qrAlt: '報到 QR 碼',
    saveButton: '儲存 QR 碼',
    savingButton: '準備中...',
    saveFailed: '未能儲存圖片，請直接截圖。',
    imageReminder: '請保留至上課當日，報到時出示',
    imageFileName: 'attendance-qr.png',
    mapButton: 'Google Map 導航',
    resaveNotice: '你的時段已更改，請重新儲存 QR 碼。',
  },
  en: {
    reminder: 'Save or screenshot this QR code and keep it until the class. Show it at check-in.',
    scanForDetails: 'Scan the QR code to see details',
    qrAlt: 'Attendance QR code',
    saveButton: 'Save QR code',
    savingButton: 'Preparing...',
    saveFailed: "Couldn't save the image. Please take a screenshot instead.",
    imageReminder: 'Keep until the class. Show it at check-in.',
    imageFileName: 'attendance-qr.png',
    mapButton: 'Open in Google Maps',
    resaveNotice: 'Your session has changed. Please save your QR code again.',
  },
};
