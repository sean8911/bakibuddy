import { PDF_RUNTIME } from "./generated/pdf-runtime";
import type { PdfExtraction } from "./types";
export interface PdfJob {
    id: string;
    base64: string;
    password: string;
}
export interface PdfReaderProps {
    job: PdfJob;
    onResult: (result: PdfExtraction) => void;
    onError: (message: string) => void;
    onProgress: (page: number, total: number) => void;
}
export const PDF_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'"></head><body><script type="module">${PDF_RUNTIME.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
export function receivePdfMessage(text: string, props: PdfReaderProps, onReady: () => void) {
    try {
        const value: unknown = JSON.parse(text);
        if (!value || typeof value !== "object" || !("type" in value))
            return;
        if (value.type === "ready") {
            onReady();
            return;
        }
        if (!("id" in value) || value.id !== props.job.id)
            return;
        if (value.type === "result" && "pages" in value && Array.isArray(value.pages))
            props.onResult({ pages: value.pages });
        else if (value.type === "progress" && "page" in value && "total" in value && typeof value.page === "number" && typeof value.total === "number")
            props.onProgress(value.page, value.total);
        else if (value.type === "error")
            props.onError("code" in value && value.code === "PASSWORD" ? "The PDF needs its opening password, or the password did not match. Enter it and try again." : "code" in value && value.code === "LIMIT" ? "This PDF exceeds the import limits. Export a shorter range (5 MB, 100 pages maximum)." : "This PDF could not be read. Choose the original text-based TNG eWallet export. Scans, screenshots and other layouts are not supported.");
    }
    catch {
        props.onError("The local PDF reader could not return this statement. Try the original export again.");
    }
}
