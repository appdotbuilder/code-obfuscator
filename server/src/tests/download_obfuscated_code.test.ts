
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type DownloadRequest } from '../schema';
import { downloadObfuscatedCode } from '../handlers/download_obfuscated_code';

// Helper function to create a test obfuscation job
const createTestJob = async (overrides: Partial<any> = {}) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const result = await db.insert(obfuscationJobsTable)
    .values({
      original_filename: 'test.py',
      language: 'python',
      password: 'test123',
      expiration_date: futureDate,
      obfuscated_code: 'print("obfuscated")',
      download_token: 'valid-token-123',
      expires_at: expiresAt,
      ...overrides
    })
    .returning()
    .execute();

  return result[0];
};

describe('downloadObfuscatedCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should download obfuscated code with valid token', async () => {
    const job = await createTestJob();
    
    const request: DownloadRequest = {
      token: job.download_token
    };

    const result = await downloadObfuscatedCode(request);

    expect(result.filename).toBe('test_obfuscated.py');
    expect(result.content).toBe('print("obfuscated")');
    expect(result.language).toBe('python');
  });

  it('should generate default filename when original_filename is null', async () => {
    const job = await createTestJob({
      original_filename: null,
      language: 'javascript'
    });

    const request: DownloadRequest = {
      token: job.download_token
    };

    const result = await downloadObfuscatedCode(request);

    expect(result.filename).toBe('obfuscated_code.js');
    expect(result.content).toBe('print("obfuscated")');
    expect(result.language).toBe('javascript');
  });

  it('should generate correct filename for javascript files', async () => {
    const job = await createTestJob({
      original_filename: 'script.js',
      language: 'javascript'
    });

    const request: DownloadRequest = {
      token: job.download_token
    };

    const result = await downloadObfuscatedCode(request);

    expect(result.filename).toBe('script_obfuscated.js');
    expect(result.language).toBe('javascript');
  });

  it('should handle filename without extension', async () => {
    const job = await createTestJob({
      original_filename: 'mycode',
      language: 'python'
    });

    const request: DownloadRequest = {
      token: job.download_token
    };

    const result = await downloadObfuscatedCode(request);

    expect(result.filename).toBe('mycode_obfuscated.py');
  });

  it('should throw error for invalid token', async () => {
    const request: DownloadRequest = {
      token: 'invalid-token'
    };

    await expect(downloadObfuscatedCode(request))
      .rejects.toThrow(/invalid or expired download token/i);
  });

  it('should throw error for expired token', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const job = await createTestJob({
      expires_at: pastDate
    });

    const request: DownloadRequest = {
      token: job.download_token
    };

    await expect(downloadObfuscatedCode(request))
      .rejects.toThrow(/invalid or expired download token/i);
  });

  it('should work with token that expires exactly now', async () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 5);

    const job = await createTestJob({
      expires_at: futureDate
    });

    const request: DownloadRequest = {
      token: job.download_token
    };

    const result = await downloadObfuscatedCode(request);
    
    expect(result).toBeDefined();
    expect(result.filename).toBe('test_obfuscated.py');
  });
});
