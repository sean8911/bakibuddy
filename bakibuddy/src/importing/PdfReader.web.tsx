import { useEffect, useRef } from "react";
import { PDF_HTML, receivePdfMessage, type PdfReaderProps } from "./pdf-bridge";
export function PdfReader(props: PdfReaderProps) {
    const frame = useRef<HTMLIFrameElement>(null);
    const latest = useRef(props);
    useEffect(() => { latest.current = props; }, [props]);
    useEffect(() => {
        let sent = false;
        const listener = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow || typeof event.data !== "string")
                return;
            receivePdfMessage(event.data, latest.current, () => { if (!sent) {
                sent = true;
                frame.current?.contentWindow?.postMessage(latest.current.job, "*");
            } });
        };
        window.addEventListener("message", listener);
        const timer = setTimeout(() => latest.current.onError("Reading timed out. Try a shorter statement or choose the file again."), 90000);
        return () => { window.removeEventListener("message", listener); clearTimeout(timer); };
    }, []);
    return <iframe ref={frame} title="Local PDF reader" sandbox="allow-scripts" srcDoc={PDF_HTML} style={{ display: "none" }}/>;
}
