import { generateReactHelpers } from "@uploadthing/react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const { useUploadThing, uploadFiles } = generateReactHelpers<any>({
  url: `${API_URL}/uploadthing`,
});
