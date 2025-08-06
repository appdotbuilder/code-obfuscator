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
  content: `def hello_world():
    name = "Python"
    print(f"Hello {name}!")
    return True`,
  password: 'test123',
  expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

// Test input for JavaScript file
const jsFileInput: FileUploadInput = {
  filename: 'test_script.js',
  content: `function helloWorld() {
    const name = "JavaScript";
    console.log(\`Hello \${name}!\`);
    return true;
  }`,
  password: 'test456',
  expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

// Simple base64 zip content containing a Python file (for zip test)
const createZipContent = (): string => {
  // This is a simplified test - in reality, we'd need proper zip content
  // For testing without adm-zip installed, we'll test the error case
  return Buffer.from('fake zip data').toString('base64');
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload and obfuscate Python file with runtime protection', async () => {
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

    // Verify expires_at is approximately 24 hours from now, not from expiration_date
    const now = new Date();
    const hoursDiff = (result.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeGreaterThan(23.5);
    expect(hoursDiff).toBeLessThan(24.5);
  });

  it('should upload and obfuscate JavaScript file with runtime protection', async () => {
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

  it('should save obfuscation job to database with enhanced protection', async () => {
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
    expect(job.obfuscated_code.length).toBeGreaterThan(pythonFileInput.content.length); // Should have protection code
    expect(job.created_at).toBeInstanceOf(Date);
  });

  it('should obfuscate Python code with runtime protection features', async () => {
    const result = await uploadFile(pythonFileInput);

    // Get the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Verify runtime protection features are present
    expect(obfuscatedCode).toContain('#!/usr/bin/env python3');
    expect(obfuscatedCode).toContain('import sys');
    expect(obfuscatedCode).toContain('import hashlib');
    expect(obfuscatedCode).toContain('import datetime');
    expect(obfuscatedCode).toContain('import pytz');
    expect(obfuscatedCode).toContain('Enter password:');
    expect(obfuscatedCode).toContain('Access denied. Invalid password.');
    expect(obfuscatedCode).toContain('Script has expired');
    expect(obfuscatedCode).toContain('Asia/Kuala_Lumpur');
    
    // Verify obfuscation (original function name should be replaced)
    expect(obfuscatedCode).not.toContain('hello_world');
    expect(obfuscatedCode).toContain('#'); // Should have obfuscation comments
    
    // Should contain password hash but not plain password
    const hashPattern = /[a-f0-9]{64}/;
    expect(hashPattern.test(obfuscatedCode)).toBe(true);
    expect(obfuscatedCode).not.toContain(pythonFileInput.password);
  });

  it('should obfuscate JavaScript code with runtime protection features', async () => {
    const result = await uploadFile(jsFileInput);

    // Get the obfuscated code from database
    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;

    // Verify runtime protection features are present
    expect(obfuscatedCode).toContain('Protected JavaScript Code');
    expect(obfuscatedCode).toContain('require(\'crypto\')');
    expect(obfuscatedCode).toContain('require(\'readline\')');
    expect(obfuscatedCode).toContain('Enter password:');
    expect(obfuscatedCode).toContain('Access denied. Invalid password.');
    expect(obfuscatedCode).toContain('Script has expired');
    expect(obfuscatedCode).toContain('Asia/Kuala_Lumpur');
    expect(obfuscatedCode).toContain('createHash(\'sha256\')');
    
    // Verify IIFE wrapper
    expect(obfuscatedCode).toContain('(function() {');
    expect(obfuscatedCode).toContain('\'use strict\';');
    
    // Verify obfuscation (original function name should be replaced)
    expect(obfuscatedCode).not.toContain('helloWorld');
    expect(obfuscatedCode).toContain('//'); // Should have obfuscation comments
    
    // Should contain password hash but not plain password
    const hashPattern = /[a-f0-9]{64}/;
    expect(hashPattern.test(obfuscatedCode)).toBe(true);
    expect(obfuscatedCode).not.toContain(jsFileInput.password);
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

  it('should handle zip files appropriately when adm-zip is not available', async () => {
    const zipInput: FileUploadInput = {
      filename: 'archive.zip',
      content: createZipContent(),
      password: 'test123',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    // Should either process the zip or throw an appropriate error
    await expect(uploadFile(zipInput)).rejects.toThrow();
  });

  it('should validate empty content', async () => {
    const emptyInput: FileUploadInput = {
      filename: 'empty.py',
      content: '   ',
      password: 'test123',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    await expect(uploadFile(emptyInput)).rejects.toThrow(/empty or contains only whitespace/i);
  });

  it('should validate password requirement', async () => {
    const noPasswordInput: FileUploadInput = {
      filename: 'test.py',
      content: 'print("hello")',
      password: '   ',
      expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    await expect(uploadFile(noPasswordInput)).rejects.toThrow(/password is required/i);
  });

  it('should generate unique download tokens for multiple uploads', async () => {
    const result1 = await uploadFile(pythonFileInput);
    const result2 = await uploadFile({
      ...pythonFileInput,
      filename: 'another_script.py'
    });

    expect(result1.download_token).not.toEqual(result2.download_token);
    expect(result1.download_token).toMatch(/^[a-f0-9]{64}$/);
    expect(result2.download_token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should embed expiration date in obfuscated code', async () => {
    const specificDate = new Date('2025-12-31T15:30:00Z');
    const input: FileUploadInput = {
      ...pythonFileInput,
      expiration_date: specificDate
    };

    const result = await uploadFile(input);

    const jobs = await db.select()
      .from(obfuscationJobsTable)
      .where(eq(obfuscationJobsTable.id, result.id))
      .execute();

    const obfuscatedCode = jobs[0].obfuscated_code;
    
    // Should contain date components based on Malaysia timezone formatting
    expect(obfuscatedCode).toContain('2025');
    expect(obfuscatedCode).toContain('12');
    expect(obfuscatedCode).toContain('31');
  });
});