import type { PdfPage, PdfSegment } from "./types.ts";
type Matrix = [
    number,
    number,
    number,
    number,
    number,
    number
];
const identity = (): Matrix => [1, 0, 0, 1, 0, 0];
function multiply(a: Matrix, b: Matrix): Matrix {
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}
function matrix(values: unknown[]): Matrix {
    if (values.length !== 6 || !values.every((v) => typeof v === "number" && Number.isFinite(v)))
        throw new Error("PDF_LAYOUT");
    return values as Matrix;
}
interface TextState {
    ctm: Matrix;
    text: Matrix;
    line: Matrix;
    size: number;
    hScale: number;
    leading: number;
    charSpace: number;
    wordSpace: number;
    rise: number;
}
interface PdfPageHandle {
    getViewport(options: {
        scale: number;
    }): {
        width: number;
        height: number;
        convertToViewportPoint(x: number, y: number): number[];
    };
    getOperatorList(): Promise<{
        fnArray: number[];
        argsArray: unknown[][];
    }>;
}
/** Keep each original PDF text run: getTextContent merges adjacent table columns in this export. */
export async function extractPage(page: PdfPageHandle, ops: Record<string, number>): Promise<PdfPage> {
    const viewport = page.getViewport({ scale: 1 });
    const list = await page.getOperatorList();
    let state: TextState = { ctm: identity(), text: identity(), line: identity(), size: 0, hScale: 1, leading: 0, charSpace: 0, wordSpace: 0, rise: 0 };
    const stack: TextState[] = [], items: PdfSegment[] = [];
    const move = (x: number, y: number) => { state.line = multiply(state.line, [1, 0, 0, 1, x, y]); state.text = [...state.line]; };
    for (let index = 0; index < list.fnArray.length; index++) {
        const op = list.fnArray[index], args = list.argsArray[index] ?? [];
        if (op === ops.save)
            stack.push({ ...state, ctm: [...state.ctm], text: [...state.text], line: [...state.line] });
        else if (op === ops.restore) {
            const prior = stack.pop();
            if (prior)
                state = prior;
        }
        else if (op === ops.transform)
            state.ctm = multiply(state.ctm, matrix(args));
        else if (op === ops.beginText) {
            state.text = identity();
            state.line = identity();
        }
        else if (op === ops.setTextMatrix) {
            state.text = matrix(Array.from(args[0] as ArrayLike<number>));
            state.line = [...state.text];
        }
        else if (op === ops.setFont)
            state.size = Number(args[1]);
        else if (op === ops.setLeading)
            state.leading = Number(args[0]);
        else if (op === ops.setCharSpacing)
            state.charSpace = Number(args[0]);
        else if (op === ops.setWordSpacing)
            state.wordSpace = Number(args[0]);
        else if (op === ops.setHScale)
            state.hScale = Number(args[0]) / 100;
        else if (op === ops.setTextRise)
            state.rise = Number(args[0]);
        else if (op === ops.moveText || op === ops.setLeadingMoveText) {
            if (op === ops.setLeadingMoveText)
                state.leading = -Number(args[1]);
            move(Number(args[0]), Number(args[1]));
        }
        else if (op === ops.nextLine)
            move(0, -state.leading);
        else if (op === ops.paintFormXObjectBegin) {
            stack.push({ ...state, ctm: [...state.ctm], text: [...state.text], line: [...state.line] });
            if (Array.isArray(args[0]))
                state.ctm = multiply(state.ctm, matrix(args[0]));
        }
        else if (op === ops.paintFormXObjectEnd) {
            const prior = stack.pop();
            if (prior)
                state = prior;
        }
        else if (op === ops.showText) {
            if (!Array.isArray(args[0]))
                throw new Error("PDF_LAYOUT");
            let text = "", advance = 0;
            for (const glyph of args[0] as unknown[]) {
                if (typeof glyph === "number") {
                    advance -= glyph * state.size / 1000;
                    continue;
                }
                if (!glyph || typeof glyph !== "object" || !("unicode" in glyph) || typeof glyph.unicode !== "string")
                    throw new Error("PDF_LAYOUT");
                text += glyph.unicode;
                const width = "width" in glyph && typeof glyph.width === "number" ? glyph.width : 0;
                const space = "isSpace" in glyph && glyph.isSpace === true;
                advance += width * state.size / 1000 + state.charSpace + (space ? state.wordSpace : 0);
            }
            const transform = multiply(state.ctm, state.text);
            const point = viewport.convertToViewportPoint(transform[4] + state.rise * transform[2], transform[5] + state.rise * transform[3]);
            if (text.trim())
                items.push({ text, x: point[0], y: point[1] });
            state.text = multiply(state.text, [1, 0, 0, 1, advance * state.hScale, 0]);
        }
    }
    return { width: viewport.width, height: viewport.height, items };
}
