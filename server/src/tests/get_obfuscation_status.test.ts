
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { getObfuscationStatus } from '../handlers/get_obfuscation_status';
import { type NewObfuscationJob } from '../db/schema';

describe('getObfuscationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return obfuscation job by ID', async () => {
    // Create test job
    const testJob: NewObfuscationJob = {
      original_filename: 'test.py',
      language: 'python',
      password: 'test-password',
      expiration_date: new Date('2024-12-31'),
      obfuscated_code: 'print("obfuscated")',
      download_token: 'test-token-123',
      expires_at: new Date('2024-12-31')
    };

    const [createdJob] = await db.insert(obfuscationJobsTable)
      .values(testJob)
      .returning()
      .execute();

    // Test retrieval
    const result = await getObfuscationStatus(createdJob.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.original_filename).toBe('test.py');
    expect(result!.language).toBe('python');
    expect(result!.password).toBe('test-password');
    expect(result!.obfuscated_code).toBe('print("obfuscated")');
    expect(result!.download_token).toBe('test-token-123');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.expires_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent job ID', async () => {
    const result = await getObfuscationStatus(999);
    expect(result).toBeNull();
  });

  it('should handle job with null original_filename', async () => {
    // Create test job without original filename
    const testJob: NewObfuscationJob = {
      original_filename: null,
      language: 'javascript',
      password: 'test-password',
      expiration_date: new Date('2024-12-31'),
      obfuscated_code: 'console.log("obfuscated");',
      download_token: 'test-token-456',
      expires_at: new Date('2024-12-31')
    };

    const [createdJob] = await db.insert(obfuscationJobsTable)
      .values(testJob)
      .returning()
      .execute();

    const result = await getObfuscationStatus(createdJob.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdJob.id);
    expect(result!.original_filename).toBeNull();
    expect(result!.language).toBe('javascript');
  });

  it('should return job with correct timestamp handling', async () => {
    const now = new Date();
    const expirationDate = new Date('2024-12-31T23:59:59Z');
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const testJob: NewObfuscationJob = {
      original_filename: 'timestamped.py',
      language: 'python',
      password: 'test-password',
      expiration_date: expirationDate,
      obfuscated_code: 'print("timestamped")',
      download_token: 'timestamp-token',
      expires_at: expiresAt
    };

    const [createdJob] = await db.insert(obfuscationJobsTable)
      .values(testJob)
      .returning()
      .execute();

    const result = await getObfuscationStatus(createdJob.id);

    expect(result).not.toBeNull();
    expect(result!.expiration_date).toBeInstanceOf(Date);
    expect(result!.expires_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    
    // Verify timestamp values are preserved correctly
    expect(result!.expiration_date.getTime()).toBe(expirationDate.getTime());
    expect(result!.expires_at.getTime()).toBe(expiresAt.getTime());
  });
});
