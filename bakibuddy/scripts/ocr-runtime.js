/* Runs only in the isolated local HTML reader, never in Hermes. */
const send = message => {
  const text = JSON.stringify(message);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
  else parent.postMessage(text, '*');
};
const bytes = base64 => Uint8Array.from(atob(base64), character => character.charCodeAt(0));
let running = false;
async function readImage(job) {
  if (running) return;
  running = true;
  let worker, workerUrl, canvas, outcome;
  try {
    send({ type: 'progress', id: job.id, progress: 0, status: 'decoding image' });
    if (typeof job.base64 !== 'string' || job.base64.length > 14 * 1024 * 1024) throw new Error('LIMIT');
    const image = new Image();
    // decode() was observed remaining pending in this nonvisual reader. Load events
    // provide dimensions before canvas drawing and also report malformed images.
    await new Promise((resolve, reject) => {
      image.onload = () => { image.onload = image.onerror = null; resolve(); };
      image.onerror = () => { image.onload = image.onerror = null; reject(new Error('READ')); };
      image.src = `data:image/${job.base64.startsWith('iVBOR') ? 'png' : 'jpeg'};base64,${job.base64}`;
    });
    send({ type: 'progress', id: job.id, progress: 0, status: 'preparing canvas' });
    if (!image.width || !image.height || image.width * image.height > 12000000) throw new Error('LIMIT');
    const scale = Math.min(2400 / Math.max(image.width, image.height), 2);
    canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = '';
    job.base64 = '';
    workerUrl = URL.createObjectURL(new Blob([bytes(OCR_WORKER)], { type: 'text/javascript' }));
    send({ type: 'progress', id: job.id, progress: 0, status: 'creating worker' });
    let failWorker;
    const workerFailure = new Promise((_, reject) => { failWorker = reject; });
    worker = await Promise.race([Tesseract.createWorker('eng', 1, {
      workerPath: workerUrl,
      workerBlobURL: false,
      // The appended language filename is a fragment; fetch reads the bundled data URL.
      langPath: `data:application/octet-stream;base64,${OCR_LANGUAGE}#`,
      cacheMethod: 'none',
      errorHandler: () => failWorker(new Error('READ')),
      logger: status => send({ type: 'progress', id: job.id, progress: status.progress, status: status.status }),
    }), workerFailure]);
    await Promise.race([worker.setParameters({ tessedit_pageseg_mode: job.mode === 'activity' ? '11' : '3', preserve_interword_spaces: '1', user_defined_dpi: '300' }), workerFailure]);
    const { data } = await Promise.race([worker.recognize(canvas, {}, { text: true, blocks: true }), workerFailure]);
    const lines = [];
    for (const block of data.blocks ?? []) for (const paragraph of block.paragraphs ?? []) for (const line of paragraph.lines ?? []) {
      lines.push({ text: line.text.trim(), confidence: line.confidence, x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 });
    }
    if (lines.length > 500 || data.text.length > 50000) throw new Error('LIMIT');
    outcome = { type: 'result', id: job.id, lines, text: data.text.slice(0, 50000), width: canvas.width, height: canvas.height };
  } catch (error) {
    outcome = { type: 'error', id: job.id, code: error?.message === 'LIMIT' ? 'LIMIT' : 'READ' };
  } finally {
    job.base64 = '';
    try { if (worker) await worker.terminate(); }
    catch { outcome = { type: 'error', id: job.id, code: 'READ' }; }
    if (canvas) canvas.width = canvas.height = 1;
    if (workerUrl) URL.revokeObjectURL(workerUrl);
    running = false;
  }
  // A terminal message removes this document. Release its worker before sending it.
  send(outcome);
}
window.__bbOcrRead = readImage;
window.__bbOcrReady = () => send({ type: 'ready' });
addEventListener('message', event => {
  if (event.source !== parent || !event.data) return;
  if (event.data.type === 'ready-request') window.__bbOcrReady();
  else if (typeof event.data.id === 'string') void readImage(event.data);
});
window.__bbOcrReady();
