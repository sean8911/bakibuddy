import { useEffect, useRef, useState } from 'react';
import { loadOcrHtml, receiveOcrMessage, type OcrReaderProps } from './ocr-bridge';
import { SCAN_LIMITS } from './types';

export function OcrReader(props: OcrReaderProps) {
  const frame = useRef<HTMLIFrameElement>(null), latest = useRef(props);
  const [html, setHtml] = useState<string>();
  useEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    let active = true, sent = false;
    void loadOcrHtml().then(value => { if (active) setHtml(value); }).catch(() => latest.current.onError('The local reader could not load. Reconnect to the development server and try again.'));
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || typeof event.data !== 'string') return;
      receiveOcrMessage(event.data, latest.current, () => { if (!sent) { sent = true; frame.current?.contentWindow?.postMessage(latest.current.job, '*'); } });
    };
    window.addEventListener('message', listener);
    const timer = setTimeout(() => latest.current.onError('Reading timed out. Choose a smaller image or enter the transaction manually.'), SCAN_LIMITS.timeoutMs);
    return () => { active = false; clearTimeout(timer); window.removeEventListener('message', listener); };
  }, []);
  return html ? <iframe ref={frame} title="Local image reader" sandbox="allow-scripts" srcDoc={html} onLoad={() => frame.current?.contentWindow?.postMessage({type:'ready-request'}, '*')} style={{ display: 'none' }} /> : null;
}
