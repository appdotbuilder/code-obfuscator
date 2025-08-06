
import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define the language enum for PostgreSQL
export const languageEnum = pgEnum('language', ['python', 'javascript']);

export const obfuscationJobsTable = pgTable('obfuscation_jobs', {
  id: serial('id').primaryKey(),
  original_filename: text('original_filename'), // Nullable by default
  language: languageEnum('language').notNull(),
  password: text('password').notNull(),
  expiration_date: timestamp('expiration_date', { withTimezone: true }).notNull(),
  obfuscated_code: text('obfuscated_code').notNull(),
  download_token: text('download_token').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(), // When the download link expires
});

// TypeScript types for the table schema
export type ObfuscationJob = typeof obfuscationJobsTable.$inferSelect;
export type NewObfuscationJob = typeof obfuscationJobsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  obfuscation_jobs: obfuscationJobsTable 
};
