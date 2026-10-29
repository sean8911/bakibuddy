import type { LedgerExport } from './export';

export async function shareLedgerExport(output: LedgerExport): Promise<string> {
  const url = URL.createObjectURL(new Blob([output.content], {type: `${output.mime};charset=utf-8`}));
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = output.name;
    document.body.appendChild(link);
    link.click();
    return 'Download requested. Check your browser downloads for the file.';
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
