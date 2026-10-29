import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const root = path.resolve('.');
const tesseract = path.dirname(require.resolve('tesseract.js/package.json'));
const core = path.dirname(require.resolve('tesseract.js-core/package.json', { paths: [tesseract] }));
const data = path.dirname(require.resolve('@tesseract.js-data/eng/package.json'));
// A portable, LSTM-only core avoids SIMD requirements and CDN selection in a local reader.
const worker = (await readFile(path.join(core, 'tesseract-core-lstm.wasm.js'), 'utf8')) + '\n;' + (await readFile(path.join(tesseract, 'dist/worker.min.js'), 'utf8'));
const api = await readFile(path.join(tesseract, 'dist/tesseract.min.js'), 'utf8');
const language = await readFile(path.join(data, '4.0.0_best_int/eng.traineddata.gz'));
const script = await readFile('scripts/ocr-runtime.js', 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; worker-src blob:; img-src data: blob:; connect-src data:; style-src 'unsafe-inline'"></head><body><script>${api.replaceAll('</script', '<\\/script')}\nconst OCR_WORKER = ${JSON.stringify(Buffer.from(worker).toString('base64'))};\nconst OCR_LANGUAGE = ${JSON.stringify(language.toString('base64'))};\n${script.replaceAll('</script', '<\\/script')}</script></body></html>`;
await mkdir('assets/ocr', { recursive: true });
await writeFile('assets/ocr/reader.html', html);
const licenses = await Promise.all([readFile(path.join(tesseract, 'LICENSE.md'), 'utf8'), readFile(path.join(core, 'LICENSE'), 'utf8')]);
await writeFile('assets/ocr/NOTICE.txt', `Tesseract.js 7.0.0 and Tesseract.js-core 7.0.0, Apache-2.0.\nEnglish model @tesseract.js-data/eng 1.0.0, 4.0.0_best_int, Apache-2.0 (Tesseract tessdata).\nSources: https://github.com/naptha/tesseract.js ; https://github.com/naptha/tesseract.js-core ; https://github.com/naptha/tessdata ; https://github.com/tesseract-ocr/tessdata\n\n${licenses.join('\n\n')}`);
console.log(`Bundled local OCR reader: ${html.length} characters at ${path.join(root, 'assets/ocr/reader.html')}`);
