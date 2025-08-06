
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type CreateObfuscationJobInput } from '../schema';
import { createObfuscationJob } from '../handlers/create_obfuscation_job';
import { eq } from 'drizzle-orm';

// Test inputs for different languages
const pythonInput: CreateObfuscationJobInput = {
  code: `def hello_world():
    name = "Python"
    print(f"Hello {name}!")
    return True`,
  language: 'python',
  password: 'test123',
  expiration_date: new Date('2024-12-31'),
  original_filename: 'test.py'
};

const javascriptInput: CreateObfuscationJobInput = {
  code: `function greet() {
    let name = "JavaScript";
    console.log(\`Hello \${name}!\`);
    return true;
  }`,
  language: 'javascript',
  password: 'test456',
  expiration_date: new Date('2024-12-31'),
  original_filename: 'test.js'
};

const minimalInput: CreateObfuscationJobInput = {
  code: 'print("Hello")',
  language: 'python',
  password: 'pass',
  expiration_date: new Date('2024-12-31')
};

describe('createObfuscationJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an obfuscation job for Python code', async () => {
    const result = await createObfuscationJob(pythonInput);

    // Validate returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.download_token).toBeDefined();
    expect(typeof result.download_token).toBe('string');
    expect(result.download_token.length).toBeGreaterThan(10); // Should be a meaningful token
    expect(result.original_filename).toEqual('test.py');
    expect(result.language).toEqual('python');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);

    // Verify expires_at is approximately 24 hours from now
    const now = new Date();
    const hoursDiff = (result.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeGreaterThan(23.5);
    expect(hoursDiff).toBeLessThan(24.5);
  });

  it('should create an obfuscation job for JavaScript code', async () => {
    const result = await createObfuscationJob(javascriptInput);

    expect(result.id).toBeDefined();
    expect(result.download_token).toBeDefined();
    expect(result.original_filename).toEqual('test.js');
    expect(result.language).toEqual('javascript');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);
  });

  it('should handle missing original_filename', async () => {
    const result = await createObfuscationJob(minimalInput);

    expect(result.id).toBeDefined();
    expect(result.download_token).toBeDefined();
    expect(result.original_filename).toBeNull();
    expect(result.language).toEqual('python');
  });

  it('should save obfuscated job to database with all required fields', async () => {
    const result = await createObfuscationJob(pythonInput);

    // Query the database to verify the job was saved
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    expect(jobs).toHaveLength(1);
    const job = jobs[0];

    expect(job.id).toEqual(result.id);
    expect(job.original_filename).toEqual('test.py');
    expect(job.language).toEqual('python');
    expect(job.password).toEqual('test123');
    expect(job.expiration_date).toBeInstanceOf(Date);
    expect(job.obfuscated_code).toBeDefined();
    expect(job.obfuscated_code).not.toEqual(pythonInput.code); // Should be obfuscated
    expect(job.download_token).toEqual(result.download_token);
    expect(job.created_at).toBeInstanceOf(Date);
    expect(job.expires_at).toBeInstanceOf(Date);
  });

  it('should obfuscate Python code differently from original', async () => {
    const result = await createObfuscationJob(pythonInput);

    // Retrieve the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Obfuscated code should be different from original
    expect(obfuscatedCode).not.toEqual(pythonInput.code);
    expect(obfuscatedCode.length).toBeGreaterThan(pythonInput.code.length); // Should have added protection code
    expect(obfuscatedCode).toContain('#'); // Should contain obfuscation comments
    
    // Should contain runtime protection features
    expect(obfuscatedCode).toContain('import sys');
    expect(obfuscatedCode).toContain('import hashlib');
    expect(obfuscatedCode).toContain('import datetime');
    expect(obfuscatedCode).toContain('import pytz');
    expect(obfuscatedCode).toContain('Enter password:');
    expect(obfuscatedCode).toContain('Access denied. Invalid password.');
    expect(obfuscatedCode).toContain('Script has expired');
    expect(obfuscatedCode).toContain('Asia/Kuala_Lumpur');
  });

  it('should obfuscate JavaScript code differently from original', async () => {
    const result = await createObfuscationJob(javascriptInput);

    // Retrieve the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Obfuscated code should be different from original
    expect(obfuscatedCode).not.toEqual(javascriptInput.code);
    expect(obfuscatedCode.length).toBeGreaterThan(javascriptInput.code.length); // Should have added protection code
    expect(obfuscatedCode).toContain('//'); // Should contain obfuscation comments
    
    // Should contain runtime protection features
    expect(obfuscatedCode).toContain('Protected JavaScript Code');
    expect(obfuscatedCode).toContain('require(\'crypto\')');
    expect(obfuscatedCode).toContain('require(\'readline\')');
    expect(obfuscatedCode).toContain('Enter password:');
    expect(obfuscatedCode).toContain('Access denied. Invalid password.');
    expect(obfuscatedCode).toContain('Script has expired');
    expect(obfuscatedCode).toContain('Asia/Kuala_Lumpur');
    expect(obfuscatedCode).toContain('createHash(\'sha256\')');
  });

  it('should generate unique download tokens for multiple jobs', async () => {
    const result1 = await createObfuscationJob(pythonInput);
    const result2 = await createObfuscationJob(javascriptInput);

    expect(result1.download_token).not.toEqual(result2.download_token);
    expect(result1.download_token.length).toBeGreaterThan(10);
    expect(result2.download_token.length).toBeGreaterThan(10);
  });

  it('should preserve expiration_date in database', async () => {
    const expirationDate = new Date('2025-01-15T10:30:00Z');
    const inputWithSpecificDate: CreateObfuscationJobInput = {
      ...pythonInput,
      expiration_date: expirationDate
    };

    const result = await createObfuscationJob(inputWithSpecificDate);

    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    expect(jobs[0].expiration_date.getTime()).toEqual(expirationDate.getTime());
  });

  it('should embed password hash in Python obfuscated code', async () => {
    const result = await createObfuscationJob(pythonInput);

    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;
    
    // Should contain a SHA256 hash (64 character hex string)
    const hashPattern = /[a-f0-9]{64}/;
    expect(hashPattern.test(obfuscatedCode)).toBe(true);
    
    // Should not contain the plain text password
    expect(obfuscatedCode).not.toContain(pythonInput.password);
  });

  it('should embed password hash in JavaScript obfuscated code', async () => {
    const result = await createObfuscationJob(javascriptInput);

    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;
    
    // Should contain a SHA256 hash (64 character hex string) for Node.js
    const hashPattern = /[a-f0-9]{64}/;
    expect(hashPattern.test(obfuscatedCode)).toBe(true);
    
    // Should not contain the plain text password
    expect(obfuscatedCode).not.toContain(javascriptInput.password);
  });

  it('should embed expiration date components in obfuscated code', async () => {
    const expirationDate = new Date('2025-06-15T14:30:45Z');
    const inputWithSpecificDate: CreateObfuscationJobInput = {
      ...pythonInput,
      expiration_date: expirationDate
    };

    const result = await createObfuscationJob(inputWithSpecificDate);

    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;
    
    // Should contain year, month, day components
    expect(obfuscatedCode).toContain('2025');
    expect(obfuscatedCode).toContain('06'); // Month
    expect(obfuscatedCode).toContain('15'); // Day
  });
});
