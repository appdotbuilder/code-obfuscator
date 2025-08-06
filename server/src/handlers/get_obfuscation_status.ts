
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ObfuscationJob } from '../schema';

export async function getObfuscationStatus(jobId: number): Promise<ObfuscationJob | null> {
  try {
    const result = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, jobId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the job as-is since all fields match between database schema and return type
    return result[0];
  } catch (error) {
    console.error('Failed to get obfuscation status:', error);
    throw error;
  }
}
