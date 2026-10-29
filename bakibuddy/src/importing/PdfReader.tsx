import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { PDF_HTML, receivePdfMessage, type PdfReaderProps } from "./pdf-bridge";
export function PdfReader(props: PdfReaderProps) {
    const reader = useRef<WebView<unknown>>(null), sent = useRef(false), latest = useRef(props);
    useEffect(() => { latest.current = props; }, [props]);
    useEffect(() => {
        const timer = setTimeout(() => latest.current.onError("Reading timed out. Try a shorter statement or choose the file again."), 90000);
        return () => clearTimeout(timer);
    }, []);
    return <View style={styles.reader} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <WebView<unknown> ref={reader} source={{ html: PDF_HTML, baseUrl: "about:blank" }} originWhitelist={["about:*"]} javaScriptEnabled incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={(request) => request.url === "about:blank" || request.url.startsWith("about:blank#")} onError={() => latest.current.onError("The local PDF reader could not start. Choose the file again.")} onMessage={(event) => receivePdfMessage(event.nativeEvent.data, latest.current, () => {
            if (sent.current)
                return;
            sent.current = true;
            const payload = JSON.stringify(latest.current.job).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
            reader.current?.injectJavaScript(`window.__bbPdfRead(${payload});true;`);
        })}/>
  </View>;
}
const styles = StyleSheet.create({ reader: { position: "absolute", width: 1, height: 1, opacity: 0 } });
