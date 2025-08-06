
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type FileUploadInput } from '../schema';
import { uploadFile } from '../handlers/upload_file';
import { eq } from 'drizzle-orm';

// Test input for Python file
const pythonFileInput: FileUploadInput = {
  filename: 'test_script.py',
  content: 'def hello_world():\n    print("Hello, World!")',
  password: 'test123',
  expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

// Test input for JavaScript file
const jsFileInput: FileUploadInput = {
  filename: 'test_script.js',
  content: 'function helloWorld() {\n    console.log("Hello, World!");\n}',
  password: 'test456',
  expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload and obfuscate Python file', async () => {
    const result = await uploadFile(pythonFileInput);

    // Verify result structure
    expect(result.id).toBeDefined();
    expect(result.download_token).toBeDefined();
    expect(result.original_filename).toEqual('test_script.py');
    expect(result.language).toEqual('python');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);

    // Verify download token is a valid hex string
    expect(result.download_token).toMatch(/^[a-f0-9]{64}$/);

    // Verify expires_at is 24 hours after expiration_date
    const expectedExpiresAt = new Date(pythonFileInput.expiration_date.getTime() + 24 * 60 * 60 * 1000);
    expect(Math.abs(result.expires_at.getTime() - expectedExpiresAt.getTime())).toBeLessThan(1000);
  });

  it('should upload and obfuscate JavaScript file', async () => {
    const result = await uploadFile(jsFileInput);

    // Verify result structure
    expect(result.id).toBeDefined();
    expect(result.download_token).toBeDefined();
    expect(result.original_filename).toEqual('test_script.js');
    expect(result.language).toEqual('javascript');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);

    // Verify download token is unique and valid
    expect(result.download_token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should save obfuscation job to database', async () => {
    const result = await uploadFile(pythonFileInput);

    // Query database to verify job was saved
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    expect(job.original_filename).toEqual('test_script.py');
    expect(job.language).toEqual('python');
    expect(job.password).toEqual('test123');
    expect(job.download_token).toEqual(result.download_token);
    expect(job.obfuscated_code).toBeDefined();
    expect(job.obfuscated_code).not.toEqual(pythonFileInput.content); // Should be obfuscated
    expect(job.created_at).toBeInstanceOf(Date);
  });

  it('should obfuscate Python code', async () => {
    const result = await uploadFile(pythonFileInput);

    // Get the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Verify code was obfuscated (function name should be replaced)
    expect(obfuscatedCode).not.toContain('hello_world');
    expect(obfuscatedCode).toContain('_func_');
    expect(obfuscatedCode).toContain('print("Hello, World!")'); // Content should remain
  });

  it('should obfuscate JavaScript code', async () => {
    const result = await uploadFile(jsFileInput);

    // Get the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Verify code was obfuscated (function name should be replaced)
    expect(obfuscatedCode).not.toContain('helloWorld');
    expect(obfuscatedCode).toContain('_func_');
    expect(obfuscatedCode).toContain('console.log("Hello, World!")'); // Content should remain
  });

  it('should reject unsupported file types', async () => {
    const invalidInput: FileUploadInput = {
      filename: 'test.txt',
      content: 'This is a text file',
      password: 'test123',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    await expect(uploadFile(invalidInput)).rejects.toThrow(/unsupported file type/i);
  });

  it('should reject zip files with appropriate error', async () => {
    const zipInput: FileUploadInput = {
      filename: 'archive.zip',
      content: 'fake zip content',
      password: 'test123',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    await expect(uploadFile(zipInput)).rejects.toThrow(/zip file processing not yet implemented/i);
  });

  it('should generate unique download tokens', async () => {
    const result1 = await uploadFile(pythonFileInput);
    const result2 = await uploadFile({
      ...pythonFileInput,
      filename: 'another_script.py'
    });

    expect(result1.download_token).not.toEqual(result2.download_token);
    expect(result1.download_token).toMatch(/^[a-f0-9]{64}$/);
    expect(result2.download_token).toMatch(/^[a-f0-9]{64}$/);
  });
});
