
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type CreateObfuscationJobInput, type ObfuscationResult } from '../schema';
import { randomBytes } from 'crypto';

// Simple obfuscation functions for demonstration
const obfuscatePython = (code: string): string => {
  return code
    // Replace variable names with random strings
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, (match, varName) => {
      if (['def', 'class', 'if', 'for', 'while', 'try', 'except', 'import', 'from'].includes(varName)) {
        return match;
      }
      const obfuscated = '_' + randomBytes(4).toString('hex');
      return match.replace(varName, obfuscated);
    })
    // Add random whitespace and comments
    .split('\n')
    .map(line => line.trim() ? line + ' # ' + randomBytes(2).toString('hex') : line)
    .join('\n');
};

const obfuscateJavaScript = (code: string): string => {
  return code
    // Replace variable names
    .replace(/\b(var|let|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, keyword, varName) => {
      const obfuscated = '_' + randomBytes(4).toString('hex');
      return `${keyword} ${obfuscated}`;
    })
    // Replace function names
    .replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, funcName) => {
      const obfuscated = '_' + randomBytes(4).toString('hex');
      return `function ${obfuscated}`;
    })
    // Add random comments
    .split('\n')
    .map(line => line.trim() ? line + ' //' + randomBytes(2).toString('hex') : line)
    .join('\n');
};

export async function createObfuscationJob(input: CreateObfuscationJobInput): Promise<ObfuscationResult> {
  try {
    // Obfuscate the code based on language
    let obfuscatedCode: string;
    switch (input.language) {
      case 'python':
        obfuscatedCode = obfuscatePython(input.code);
        break;
      case 'javascript':
        obfuscatedCode = obfuscateJavaScript(input.code);
        break;
      default:
        throw new Error(`Unsupported language: ${input.language}`);
    }

    // Generate unique download token
    const downloadToken = randomBytes(32).toString('hex');

    // Calculate expires_at (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Insert obfuscation job record
    const result = await db.insert(obfuscationJobsTable)
      .values({
        original_filename: input.original_filename || null,
        language: input.language,
        password: input.password,
        expiration_date: input.expiration_date,
        obfuscated_code: obfuscatedCode,
        download_token: downloadToken,
        expires_at: expiresAt
      })
      .returning()
      .execute();

    const job = result[0];

    return {
      id: job.id,
      download_token: job.download_token,
      original_filename: job.original_filename,
      language: job.language,
      created_at: job.created_at,
      expires_at: job.expires_at
    };
  } catch (error) {
    console.error('Obfuscation job creation failed:', error);
    throw error;
  }
}
