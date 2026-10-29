import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { loadOcrHtml, receiveOcrMessage, type OcrReaderProps } from './ocr-bridge';
import { SCAN_LIMITS } from './types';

export function OcrReader(props: OcrReaderProps) {
  const reader = useRef<WebView<unknown>>(null), sent = useRef(false), latest = useRef(props);
  const [html, setHtml] = useState<string>();
  useEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    let active = true;
    void loadOcrHtml().then(value => { if (active) setHtml(value); }).catch(() => latest.current.onError('The local reader could not load. Reconnect to the development server and try again.'));
    const timer = setTimeout(() => latest.current.onError('Reading timed out. Choose a smaller image or enter the transaction manually.'), SCAN_LIMITS.timeoutMs);
    return () => { active = false; clearTimeout(timer); };
  }, []);
  return html ? <View style={styles.reader} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <WebView<unknown> ref={reader} onLoadEnd={() => reader.current?.injectJavaScript('window.__bbOcrReady?.();true;')} source={{ html, baseUrl: 'https://bakibuddy.invalid/' }} originWhitelist={['https://bakibuddy.invalid', 'about:*']} javaScriptEnabled incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'https://bakibuddy.invalid/' || request.url.startsWith('https://bakibuddy.invalid/#')} onError={() => latest.current.onError('The local image reader could not start. Try the image again.')} onMessage={event => receiveOcrMessage(event.nativeEvent.data, latest.current, () => {
      if (sent.current) return;
      sent.current = true;
      const payload = JSON.stringify(latest.current.job).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
      reader.current?.injectJavaScript(`window.__bbOcrRead(${payload});true;`);
    })} />
  </View> : null;
}
const styles = StyleSheet.create({ reader: { position: 'absolute', width: 1, height: 1, opacity: 0 } });
