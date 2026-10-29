import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { WorkerMessageHandler } from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { extractPage } from "../src/importing/pdf-text";
import { IMPORT_LIMITS } from "../src/importing/types";
// A local fake worker avoids network/worker files in mobile WebViews and sandboxed iframes.
Object.assign(globalThis, { pdfjsWorker: { WorkerMessageHandler } });
let running = false;
const send = (value: unknown) => {
    const message = JSON.stringify(value);
    const bridge = (window as unknown as {
        ReactNativeWebView?: {
            postMessage(message: string): void;
        };
    }).ReactNativeWebView;
    if (bridge)
        bridge.postMessage(message);
    else
        parent.postMessage(message, "*");
};
async function read(message: {
    id: string;
    base64: string;
    password: string;
}) {
    if (running)
        return;
    running = true;
    let task: ReturnType<typeof getDocument> | undefined;
    try {
        const decoded = atob(message.base64);
        if (decoded.length > IMPORT_LIMITS.bytes)
            throw new Error("PDF_SIZE");
        const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
        task = getDocument({ data: bytes, password: message.password, verbosity: 0, useWasm: false, useWorkerFetch: false, stopAtErrors: true, disableFontFace: true, enableXfa: false, disableAutoFetch: true, disableStream: true });
        message.password = "";
        const pdf = await task.promise;
        if (pdf.numPages < 1 || pdf.numPages > IMPORT_LIMITS.pages)
            throw new Error("PDF_PAGES");
        const pages = [];
        let segments = 0, characters = 0;
        for (let index = 1; index <= pdf.numPages; index++) {
            const page = await extractPage(await pdf.getPage(index), OPS);
            segments += page.items.length;
            characters += page.items.reduce((sum, item) => sum + item.text.length, 0);
            if (segments > IMPORT_LIMITS.textSegments || characters > IMPORT_LIMITS.textCharacters)
                throw new Error("PDF_SIZE");
            pages.push(page);
            send({ type: "progress", id: message.id, page: index, total: pdf.numPages });
        }
        send({ type: "result", id: message.id, pages });
    }
    catch (failure) {
        const error = failure as {
            name?: string;
            message?: string;
        };
        const code = error.name === "PasswordException" ? "PASSWORD" : error.message === "PDF_SIZE" || error.message === "PDF_PAGES" ? "LIMIT" : "UNSUPPORTED";
        send({ type: "error", id: message.id, code });
    }
    finally {
        message.password = "";
        message.base64 = "";
        if (task)
            await task.destroy().catch(() => undefined);
        running = false;
    }
}
Object.assign(window, { __bbPdfRead: read });
addEventListener("message", (event) => {
    if (event.source !== parent)
        return;
    const value = event.data;
    if (value && typeof value.id === "string" && typeof value.base64 === "string" && typeof value.password === "string")
        void read(value);
});
send({ type: "ready" });
