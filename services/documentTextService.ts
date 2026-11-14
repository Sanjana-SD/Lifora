import { requireOptionalNativeModule } from 'expo';
import * as Pdf from 'expo-pdf-text-extract';

// On-device text reading for imported files. Nothing leaves the phone:
// PDFs are read with PDFBox, photos with Google ML Kit text recognition.
// Both are native modules, so they exist only in an installed build (not
// Expo Go, not web); callers check `canRead*` and explain when unavailable.

interface TextExtractorModule {
  isSupported: boolean;
  extractTextFromImage(path: string): Promise<string[]>;
}

// Loaded optionally: expo-text-extractor's own entry throws when the native
// module is missing, which would crash the whole app in Expo Go.
const textExtractor = requireOptionalNativeModule<TextExtractorModule>('ExpoTextExtractor');

export type ReadFailure = 'unsupported' | 'password_required' | 'incorrect_password' | 'unreadable' | 'no_text';

export class DocumentReadError extends Error {
  constructor(readonly reason: ReadFailure) {
    super(reason);
    this.name = 'DocumentReadError';
  }
}

export const canReadPdfs = (): boolean => {
  try {
    return Pdf.isAvailable();
  } catch {
    return false;
  }
};

export const canReadImages = (): boolean => !!textExtractor?.isSupported;

/** Text of every page, in reading order (PDFBox sorts by position on the page). */
export async function readPdfText(uri: string, password?: string): Promise<string> {
  if (!canReadPdfs()) throw new DocumentReadError('unsupported');
  let text: string;
  try {
    text = await Pdf.extractText(uri, password || undefined);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'PASSWORD_REQUIRED') throw new DocumentReadError('password_required');
    if (code === 'INCORRECT_PASSWORD') throw new DocumentReadError(password ? 'incorrect_password' : 'password_required');
    throw new DocumentReadError('unreadable');
  }
  // A scanned (image-only) PDF has no text layer.
  if (text.replace(/\s/g, '').length < 10) throw new DocumentReadError('no_text');
  return text;
}

/** Recognized lines of text in a photo or screenshot. */
export async function readImageText(uri: string): Promise<string> {
  if (!textExtractor || !textExtractor.isSupported) throw new DocumentReadError('unsupported');
  let lines: string[];
  try {
    lines = await textExtractor.extractTextFromImage(uri.replace('file://', ''));
  } catch {
    throw new DocumentReadError('unreadable');
  }
  const text = lines.join('\n');
  if (text.replace(/\s/g, '').length < 3) throw new DocumentReadError('no_text');
  return text;
}

/** Plain-language explanation for each failure. */
export function describeReadFailure(reason: ReadFailure, kind: 'statement' | 'document'): string {
  switch (reason) {
    case 'unsupported':
      return 'Reading files needs the installed LIFORA app. It isn’t available in Expo Go or the web preview.';
    case 'password_required':
      return 'This PDF is password-protected.';
    case 'incorrect_password':
      return "That password didn't open the PDF. Check it and try again.";
    case 'no_text':
      return kind === 'statement'
        ? 'This PDF has no readable text (it may be a scanned copy). Download the statement again from net banking as a PDF.'
        : "Couldn't find any text. Try a clearer, well-lit photo with the text filling the frame.";
    default:
      return kind === 'statement' ? "Couldn't open this PDF. It may be damaged." : "Couldn't read this file.";
  }
}
