import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import { IMPORT_LIMITS } from "./types";
import { LedgerError } from "../utils/validation";
export async function pickPdf() {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false, base64: false });
    if (result.canceled)
        return null;
    const asset = result.assets[0];
    let base64: string;
    if (Platform.OS === "web") {
        if (asset.size !== undefined && asset.size > IMPORT_LIMITS.bytes)
            throw new LedgerError("Choose a PDF smaller than 5 MB. Export a shorter date range.");
        if (!asset.file)
            throw new LedgerError("The browser could not open this file. Choose it again.");
        base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new LedgerError("This file could not be read. Choose it again."));
            reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
            reader.readAsDataURL(asset.file!);
        });
    }
    else {
        const fs = await import("expo-file-system/legacy");
        try {
            const info=await fs.getInfoAsync(asset.uri);
            if(!info.exists||info.isDirectory)throw new LedgerError("This file could not be opened. Choose it again.");
            if(info.size>IMPORT_LIMITS.bytes)throw new LedgerError("Choose a PDF smaller than 5 MB. Export a shorter date range.");
            base64 = await fs.readAsStringAsync(asset.uri, { encoding: fs.EncodingType.Base64 });
        }
        finally {
            if (fs.cacheDirectory && asset.uri.startsWith(`${fs.cacheDirectory}DocumentPicker/`))
                await fs.deleteAsync(asset.uri, { idempotent: true }).catch(() => undefined);
        }
    }
    if (base64.length > Math.ceil(IMPORT_LIMITS.bytes / 3) * 4)
        throw new LedgerError("Choose a PDF smaller than 5 MB.");
    if (!base64.startsWith("JVBERi0"))
        throw new LedgerError("This file is not a PDF. Choose the original TNG export.");
    return { name: asset.name, base64 };
}
