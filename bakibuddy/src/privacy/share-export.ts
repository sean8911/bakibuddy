import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { LedgerExport } from './export';
import { LedgerError } from '../utils/validation';

export async function shareLedgerExport(output: LedgerExport): Promise<string> {
  if (!await Sharing.isAvailableAsync()) throw new LedgerError('File sharing is unavailable on this device. Your records have not changed.');
  const directory = new Directory(Paths.cache, 'bakibuddy-exports');
  if (directory.exists) directory.delete();
  directory.create({ intermediates: true });
  const file = new File(directory, output.name);
  try {
    file.create();
    file.write(output.content);
    await Sharing.shareAsync(file.uri, { mimeType: output.mime, UTI: output.mime === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json', dialogTitle: 'Save your BakiBuddy export' });
    return 'Share sheet closed. Check your chosen destination for a saved copy.';
  } finally {
    // This directory contains only temporary exports owned by this app.
    if (directory.exists) directory.delete();
  }
}
