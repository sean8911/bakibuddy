import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { LedgerError } from '../utils/validation';
import { SCAN_LIMITS } from './types';

export async function pickScanImage() {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: false, base64: true, quality: 1, exif: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  try {
    if (![asset.width,asset.height].every(Number.isFinite) || asset.width <= 0 || asset.height <= 0) throw new LedgerError('This image could not be opened. Choose a different JPEG or PNG.');
    if ((asset.fileSize ?? 0) > SCAN_LIMITS.bytes || asset.width * asset.height > SCAN_LIMITS.pixels) throw new LedgerError('Choose an image under 10 MB and 12 megapixels. Crop a large photo in Photos first.');
    const base64 = asset.base64;
    if (!base64 || base64.length > Math.ceil(SCAN_LIMITS.bytes / 3) * 4) throw new LedgerError('This image could not be read or is too large. Choose a JPEG or PNG under 10 MB.');
    if (!base64.startsWith('/9j/') && !base64.startsWith('iVBORw0KGgo')) throw new LedgerError('Choose a JPEG or PNG image. Convert HEIC, GIF or other formats first.');
    const uri = `data:image/${base64.startsWith('iVBOR') ? 'png' : 'jpeg'};base64,${base64}`;
    return { base64, uri, name: asset.fileName ?? 'Selected image', width: asset.width, height: asset.height };
  } finally {
    if (Platform.OS !== 'web') {
      const fs = await import('expo-file-system/legacy');
      if (fs.cacheDirectory && asset.uri.startsWith(`${fs.cacheDirectory}ImagePicker/`)) await fs.deleteAsync(asset.uri, { idempotent: true }).catch(() => undefined);
    } else if (asset.uri.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
  }
}
