import { createUploadthing } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  cvUploader: f({
    pdf: { maxFileSize: "16MB" },
    blob: { maxFileSize: "16MB" }
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.ufsUrl || file.url);
    }),
  // Interview answer recordings (MediaRecorder webm/mp4), transcribed
  // server-side when the interview is finalised.
  audioUploader: f({
    audio: { maxFileSize: "16MB" }
  })
    .onUploadComplete(async ({ file }) => {
      console.log("Audio upload complete:", file.ufsUrl || file.url);
    }),
};
