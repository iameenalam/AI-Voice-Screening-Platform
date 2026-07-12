import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Strip speech-engine artifact tokens (e.g. </s>, [BLANK_AUDIO]) that some
// recognisers leak into transcripts, and collapse whitespace. Used for display
// of older interviews; new interviews are sanitised server-side on save.
export function cleanTranscriptText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/<\/?s>/gi, " ")
    .replace(/\[(?:blank_audio|music|inaudible|noise|silence)\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
