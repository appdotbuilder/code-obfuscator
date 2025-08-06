
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type DownloadRequest, type DownloadResponse } from '../schema';
import { eq, and, gt } from 'drizzle-orm';

export async function downloadObfuscatedCode(input: DownloadRequest): Promise<DownloadResponse> {
  try {
    const now = new Date();
    
    // Find the obfuscation job by download token
    const results = await db.select()
      .from(obfuscationJobsTable)
      .where(
        and(
          eq(obfuscationJobsTable.download_token, input.token),
          gt(obfuscationJobsTable.expires_at, now) // Check if not expired
        )
      )
      .limit(1)
      .execute();

    if (results.length === 0) {
      throw new Error('Invalid or expired download token');
    }

    const job = results[0];

    // Determine filename based on language
    const getFilename = (originalFilename: string | null, language: string): string => {
      if (originalFilename) {
        // Use original filename, potentially updating extension
        const baseName = originalFilename.replace(/\.[^/.]+$/, '');
        const extension = language === 'python' ? '.py' : '.js';
        return `${baseName}_obfuscated${extension}`;
      }
      
      // Generate default filename
      return language === 'python' ? 'obfuscated_code.py' : 'obfuscated_code.js';
    };

    const filename = getFilename(job.original_filename, job.language);

    return {
      filename,
      content: job.obfuscated_code,
      language: job.language
    };
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
