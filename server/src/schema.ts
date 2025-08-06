
import { z } from 'zod';

// Supported programming languages
export const languageEnum = z.enum(['python', 'javascript']);
export type Language = z.infer<typeof languageEnum>;

// Obfuscation job schema
export const obfuscationJobSchema = z.object({
  id: z.number(),
  original_filename: z.string().nullable(),
  language: languageEnum,
  password: z.string(),
  expiration_date: z.coerce.date(),
  obfuscated_code: z.string(),
  download_token: z.string(),
  created_at: z.coerce.date(),
  expires_at: z.coerce.date()
});

export type ObfuscationJob = z.infer<typeof obfuscationJobSchema>;

// Input schema for creating obfuscation jobs
export const createObfuscationJobInputSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  language: languageEnum,
  password: z.string().min(1, 'Password is required'),
  expiration_date: z.coerce.date(),
  original_filename: z.string().nullable().optional()
});

export type CreateObfuscationJobInput = z.infer<typeof createObfuscationJobInputSchema>;

// File upload schema
export const fileUploadInputSchema = z.object({
  filename: z.string(),
  content: z.string(),
  password: z.string().min(1, 'Password is required'),
  expiration_date: z.coerce.date()
});

export type FileUploadInput = z.infer<typeof fileUploadInputSchema>;

// Download schema
export const downloadRequestSchema = z.object({
  token: z.string().min(1, 'Download token is required')
});

export type DownloadRequest = z.infer<typeof downloadRequestSchema>;

// Download response schema
export const downloadResponseSchema = z.object({
  filename: z.string(),
  content: z.string(),
  language: languageEnum
});

export type DownloadResponse = z.infer<typeof downloadResponseSchema>;

// Obfuscation result schema
export const obfuscationResultSchema = z.object({
  id: z.number(),
  download_token: z.string(),
  original_filename: z.string().nullable(),
  language: languageEnum,
  created_at: z.coerce.date(),
  expires_at: z.coerce.date()
});

export type ObfuscationResult = z.infer<typeof obfuscationResultSchema>;
