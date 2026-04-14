export interface ParticipantTranslations {
  pageTitle: string;
  pageSubtitle: string;
  participantDetailsSection: string;
  participantIdLabel: string;
  nameLabel: string;
  classLabel: string;
  sessionLabel: string;
  locationLabel: string;
  dateLabel: string;
  timeLabel: string;
  directionsLabel: string;
  directionsLink: string;
  qrCodeSection: string;
  qrCodeAlt: string;
  changeSessionButton: string;
  notFoundError: string;
  acceptedTermsSection: string;
}

export const participantTranslations: Record<'zh-TW' | 'en', ParticipantTranslations> = {
  'zh-TW': {
    pageTitle: '參加者通行證',
    pageSubtitle: '出示此 QR 碼以登記出席。',
    participantDetailsSection: '參加者資料',
    participantIdLabel: '參加者編號',
    nameLabel: '姓名',
    classLabel: '課程',
    sessionLabel: '時段',
    locationLabel: '地點',
    dateLabel: '日期',
    timeLabel: '時間',
    directionsLabel: '路線',
    directionsLink: '查看路線',
    qrCodeSection: '報到 QR 碼',
    qrCodeAlt: '參加者 QR 碼',
    changeSessionButton: '更改時段',
    notFoundError: '找不到此連結對應的參加者資料。',
    acceptedTermsSection: '已接受條款',
  },
  en: {
    pageTitle: 'Participant Pass',
    pageSubtitle: 'Present this QR code at check-in for attendance.',
    participantDetailsSection: 'Participant details',
    participantIdLabel: 'Participant ID',
    nameLabel: 'Name',
    classLabel: 'Class',
    sessionLabel: 'Session',
    locationLabel: 'Location',
    dateLabel: 'Date',
    timeLabel: 'Time',
    directionsLabel: 'Directions',
    directionsLink: 'Get Directions',
    qrCodeSection: 'Check-in QR code',
    qrCodeAlt: 'QR code for participant',
    changeSessionButton: 'Change Session',
    notFoundError: 'We could not find participant details for this link.',
    acceptedTermsSection: 'Accepted Terms',
  },
};
