import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { OcrExtraction, OcrLine, ScanMode } from './types';
import readerAsset from '../../assets/ocr/reader.html';

export interface OcrJob { id: string; base64: string; mode: ScanMode }
export interface OcrReaderProps { job: OcrJob; onResult: (extraction: OcrExtraction) => void; onError: (message: string) => void; onProgress: (message: string) => void }
let html: Promise<string> | undefined;
export function loadOcrHtml() {
  html ??= (async () => {
    const asset = Asset.fromModule(readerAsset);
    await asset.downloadAsync();
    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error('OCR asset unavailable');
      return response.text();
    }
    return new File(asset.localUri ?? asset.uri).text();
  })().catch(error => { html = undefined; throw error; });
  return html;
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
export function receiveOcrMessage(text: string, props: OcrReaderProps, ready: () => void) {
  if (text.length > 200000) { props.onError('The image produced too much text. Choose a smaller image.'); return; }
  try {
    const message: unknown = JSON.parse(text);
    if (!object(message)) return;
    if (message.type === 'ready') { ready(); return; }
    if (message.id !== props.job.id) return;
    if (message.type === 'error') { props.onError(message.code === 'LIMIT' ? 'Choose a smaller image under 10 MB and 12 megapixels.' : 'The image could not be read. Try a clearer JPEG or PNG, or enter the transaction manually.'); return; }
    if (message.type === 'progress') {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') props.onProgress(`Reading image… ${Math.round(Math.max(0,Math.min(1,message.progress))*100)}%`);
      else props.onProgress('Preparing the local image reader…');
      return;
    }
    if (message.type !== 'result') return;
    if (typeof message.text !== 'string' || !Array.isArray(message.lines) || typeof message.width !== 'number' || typeof message.height !== 'number') throw new Error('Invalid OCR response');
    const lines: OcrLine[] = message.lines.map((line: unknown) => {
      if (!object(line) || typeof line.text !== 'string' || typeof line.confidence !== 'number' || typeof line.x !== 'number' || typeof line.y !== 'number' || typeof line.width !== 'number' || typeof line.height !== 'number') throw new Error('Invalid OCR line');
      return { text: line.text, confidence: line.confidence, x: line.x, y: line.y, width: line.width, height: line.height };
    });
    props.onResult({ text: message.text, lines, width: message.width, height: message.height });
  } catch { props.onError('The reader returned invalid text. Choose the image again.'); }
}
