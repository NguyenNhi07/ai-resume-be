import crypto from 'crypto';

export function randomUid(length: number = 12): string {
  const characters = '0123456789abcdef';
  return Array.from(
    { length },
    () => characters[crypto.randomInt(0, characters.length)],
  ).join('');
}

export function randomDeviceFingerprint(): string {
  const randomNumber = crypto.randomInt(10000, 100000);
  return `fp_${randomNumber}`;
}

export function randomIpAddress(): string {
  const segments = Array.from({ length: 4 }, () => crypto.randomInt(0, 256));
  return segments.join('.');
}

export function randomMaid(platform: 'ios' | 'android' = 'android'): string {
  if (platform === 'ios') {
    // iOS IDFA format: 8-4-4-4-12 hexadecimal digits
    const segments = [8, 4, 4, 4, 12].map((length) =>
      Array.from({ length }, () => '0123456789ABCDEF'[crypto.randomInt(16)]).join(''),
    );
    return segments.join('-');
  } else {
    // Android GAID format: 8-4-4-4-12 hexadecimal digits lowercase
    const segments = [8, 4, 4, 4, 12].map((length) =>
      Array.from({ length }, () => '0123456789abcdef'[crypto.randomInt(16)]).join(''),
    );
    return segments.join('-');
  }
}
