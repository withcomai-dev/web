"use client";

import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  listAll,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { v4 as uuid } from "uuid";
import { storage } from "@/lib/firebase";

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  name: string;
}

const DEFAULT_OPTS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
  initialQuality: 0.85,
};

function extOf(file: File): string {
  const i = file.name.lastIndexOf(".");
  return i >= 0 ? file.name.slice(i) : "";
}

export async function uploadAsset(
  file: File,
  folder = "general",
  options: Partial<Parameters<typeof imageCompression>[1]> = {},
): Promise<UploadResult> {
  let working: File = file;

  if (file.type.startsWith("image/") && !file.type.includes("svg")) {
    try {
      working = await imageCompression(file, { ...DEFAULT_OPTS, ...options });
    } catch {
      working = file;
    }
  }

  const ext = working.type.includes("jpeg") || working.type.includes("jpg") ? ".jpg" : extOf(working) || extOf(file);
  const path = `assets/${folder}/${uuid()}${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, working, { contentType: working.type || file.type });
  const url = await getDownloadURL(ref);
  return { url, path, size: working.size, name: file.name };
}

export interface AssetItem {
  url: string;
  path: string;
  size: number;
  updated: string;
}

export async function listAssets(folder = "general", maxItems = 100): Promise<AssetItem[]> {
  const dir = storageRef(storage, `assets/${folder}`);
  const res = await listAll(dir);
  const items = await Promise.all(
    res.items.slice(0, maxItems).map(async (item) => {
      const [url, meta] = await Promise.all([getDownloadURL(item), getMetadata(item)]);
      return {
        url,
        path: item.fullPath,
        size: meta.size,
        updated: meta.updated,
      };
    }),
  );
  return items.sort((a, b) => (a.updated < b.updated ? 1 : -1));
}

export async function deleteAsset(path: string): Promise<void> {
  await deleteObject(storageRef(storage, path));
}
