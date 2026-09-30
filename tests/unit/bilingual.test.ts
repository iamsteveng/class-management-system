import { describe, it, expect } from 'vitest';
import { getLocalizedText } from '../../app/lib/i18n';
import { translations } from '../../app/i18n/translations';

// ─── getLocalizedText ───────────────────────────────────────────────────────

describe('getLocalizedText', () => {
  it('returns zh when lang=zh', () => {
    expect(getLocalizedText('中文名稱', 'English Name', 'zh')).toBe('中文名稱');
  });

  it('returns zh as fallback when lang=en but en is undefined', () => {
    expect(getLocalizedText('中文名稱', undefined, 'en')).toBe('中文名稱');
  });

  it('returns en when lang=en and en is defined', () => {
    expect(getLocalizedText('中文名稱', 'English Name', 'en')).toBe('English Name');
  });

  it('returns zh when lang=zh even if en is defined', () => {
    expect(getLocalizedText('地點中文', '地點 EN', 'zh')).toBe('地點中文');
  });
});

// ─── WhatsApp purchase confirmation message ─────────────────────────────────

describe('bilingual WhatsApp purchase confirmation message', () => {
  function buildConfirmationMessage(link: string): string {
    return `你的訂單已確認！請點擊以下連結接受條款及選擇地點時間：${link}\nYour purchase is confirmed! Please accept terms and select session: ${link}`;
  }

  it('contains ZH confirmation text', () => {
    const msg = buildConfirmationMessage('https://example.com/terms?token=abc');
    expect(msg).toContain('你的訂單已確認');
    expect(msg).toContain('接受條款及選擇地點時間');
  });

  it('contains EN confirmation text', () => {
    const msg = buildConfirmationMessage('https://example.com/terms?token=abc');
    expect(msg).toContain('Your purchase is confirmed!');
    expect(msg).toContain('Please accept terms and select session');
  });

  it('contains the link in both parts', () => {
    const link = 'https://example.com/terms?token=xyz';
    const msg = buildConfirmationMessage(link);
    // Link appears twice (once in ZH part, once in EN part)
    expect(msg.split(link).length - 1).toBe(2);
  });
});

// ─── WhatsApp participant links message ─────────────────────────────────────

describe('bilingual WhatsApp participant links message', () => {
  const baseUrl = 'https://example.com';

  function buildSingleParticipantMessage(participantId: string): string {
    const link = `${baseUrl}/participant/${encodeURIComponent(participantId)}`;
    return `你的參加者 QR 連結：${link}\nYour participant QR link: ${link}`;
  }

  function buildMultipleParticipantMessage(participantIds: string[]): string {
    const links = participantIds.map(
      (id, index) => `${index + 1}. ${baseUrl}/participant/${encodeURIComponent(id)}`
    );
    return `你的參加者 QR 連結：\n${links.join('\n')}\nYour participant QR links:\n${links.join('\n')}`;
  }

  it('single participant: contains ZH text', () => {
    const msg = buildSingleParticipantMessage('p-001');
    expect(msg).toContain('你的參加者 QR 連結：');
  });

  it('single participant: contains EN text', () => {
    const msg = buildSingleParticipantMessage('p-001');
    expect(msg).toContain('Your participant QR link:');
  });

  it('single participant: link appears twice', () => {
    const participantId = 'p-001';
    const msg = buildSingleParticipantMessage(participantId);
    const link = `${baseUrl}/participant/${encodeURIComponent(participantId)}`;
    expect(msg.split(link).length - 1).toBe(2);
  });

  it('multiple participants: contains ZH list header', () => {
    const msg = buildMultipleParticipantMessage(['p-001', 'p-002']);
    expect(msg).toContain('你的參加者 QR 連結：');
  });

  it('multiple participants: contains EN list header', () => {
    const msg = buildMultipleParticipantMessage(['p-001', 'p-002']);
    expect(msg).toContain('Your participant QR links:');
  });

  it('multiple participants: links appear twice each', () => {
    const ids = ['p-001', 'p-002'];
    const msg = buildMultipleParticipantMessage(ids);
    for (const id of ids) {
      const link = `${baseUrl}/participant/${encodeURIComponent(id)}`;
      expect(msg).toContain(link);
    }
    // Each link appears in both ZH and EN sections (as "1. link")
    expect(msg).toContain('1. ');
    expect(msg).toContain('2. ');
  });
});

// ─── Class Duration formatting ──────────────────────────────────────────────

describe('courses.duration', () => {
  it('formats whole hours in ZH', () => {
    expect(translations['zh-TW'].courses.duration(180)).toBe('3 小時');
  });

  it('formats hours and minutes in ZH', () => {
    expect(translations['zh-TW'].courses.duration(90)).toBe('1 小時 30 分鐘');
  });

  it('formats singular and plural hours in EN', () => {
    expect(translations.en.courses.duration(60)).toBe('1 hour');
    expect(translations.en.courses.duration(120)).toBe('2 hours');
  });

  it('formats minutes only in EN', () => {
    expect(translations.en.courses.duration(45)).toBe('45 min');
  });
});
