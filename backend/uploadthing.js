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
};
