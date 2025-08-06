
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type FileUploadInput, type ObfuscationResult } from '../schema';
import { randomBytes } from 'crypto';

// Simple obfuscation functions for demonstration
function obfuscatePython(code: string): string {
  return code
    .replace(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      const obfuscated = '_func_' + randomBytes(4).toString('hex');
      return match.replace(name, obfuscated);
    })
    .replace(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      const obfuscated = '_Class_' + randomBytes(4).toString('hex');
      return match.replace(name, obfuscated);
    });
}

function obfuscateJavaScript(code: string): string {
  return code
    .replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      const obfuscated = '_func_' + randomBytes(4).toString('hex');
      return match.replace(name, obfuscated);
    })
    .replace(/const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, (match, name) => {
      const obfuscated = '_var_' + randomBytes(4).toString('hex');
      return match.replace(name, obfuscated);
    });
}

function detectLanguageFromFilename(filename: string): 'python' | 'javascript' | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'py') return 'python';
  if (ext === 'js') return 'javascript';
  return null;
}

function validateFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'py' || ext === 'js' || ext === 'zip';
}

export async function uploadFile(input: FileUploadInput): Promise<ObfuscationResult> {
  try {
    // Validate file type
    if (!validateFileType(input.filename)) {
      throw new Error('Unsupported file type. Only .py, .js, and .zip files are allowed.');
    }

    // Handle zip files
    if (input.filename.toLowerCase().endsWith('.zip')) {
      // For zip files, we'll simulate extracting the first supported file
      // In a real implementation, you'd extract the zip and process each file
      throw new Error('Zip file processing not yet implemented');
    }

    // Detect language from filename
    const language = detectLanguageFromFilename(input.filename);
    if (!language) {
      throw new Error('Could not detect programming language from filename');
    }

    // Obfuscate the code based on language
    let obfuscatedCode: string;
    if (language === 'python') {
      obfuscatedCode = obfuscatePython(input.content);
    } else {
      obfuscatedCode = obfuscateJavaScript(input.content);
    }

    // Generate unique download token
    const downloadToken = randomBytes(32).toString('hex');

    // Calculate expiration timestamp (24 hours from now)
    const expiresAt = new Date(input.expiration_date.getTime() + 24 * 60 * 60 * 1000);

    // Insert obfuscation job into database
    const result = await db.insert(obfuscationJobsTable)
      .values({
        original_filename: input.filename,
        language: language,
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
    console.error('File upload failed:', error);
    throw error;
  }
}
