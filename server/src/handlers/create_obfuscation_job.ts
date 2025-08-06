
import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type CreateObfuscationJobInput, type ObfuscationResult } from '../schema';
import { randomBytes } from 'crypto';

// Enhanced obfuscation functions with runtime protection
const obfuscatePython = (code: string, password: string, expirationDate: Date): string => {
  // Generate random variable names for obfuscation
  const varMap = new Map<string, string>();
  const getObfuscatedName = (original: string): string => {
    if (!varMap.has(original)) {
      varMap.set(original, '_' + randomBytes(4).toString('hex'));
    }
    return varMap.get(original)!;
  };

  // Obfuscate variable names (preserve Python keywords and built-ins)
  const pythonKeywords = new Set(['def', 'class', 'if', 'for', 'while', 'try', 'except', 'import', 'from', 'as', 'with', 'return', 'yield', 'pass', 'break', 'continue', 'global', 'nonlocal', 'lambda', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple']);
  
  let obfuscatedCode = code;
  
  // Replace variable assignments
  obfuscatedCode = obfuscatedCode.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, (match, varName) => {
    if (pythonKeywords.has(varName)) {
      return match;
    }
    return match.replace(varName, getObfuscatedName(varName));
  });

  // Replace variable usage
  obfuscatedCode = obfuscatedCode.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, varName) => {
    if (pythonKeywords.has(varName) || !varMap.has(varName)) {
      return match;
    }
    return getObfuscatedName(varName);
  });

  // Format expiration date for Malaysia timezone
  const malaysiaDate = expirationDate.toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' });
  const [datePart, timePart] = malaysiaDate.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute, second] = timePart.split(':');

  // Create runtime protection wrapper
  const protectedCode = `#!/usr/bin/env python3
# Protected Python Script
import sys
import hashlib
import datetime
try:
    import pytz
except ImportError:
    print("Error: pytz module is required. Install with: pip install pytz")
    sys.exit(1)

def ${getObfuscatedName('check_auth')}():
    # Password verification
    ${getObfuscatedName('user_input')} = input("Enter password: ")
    ${getObfuscatedName('expected_hash')} = "${hashPassword(password)}"
    ${getObfuscatedName('actual_hash')} = hashlib.sha256(${getObfuscatedName('user_input')}.encode()).hexdigest()
    
    if ${getObfuscatedName('actual_hash')} != ${getObfuscatedName('expected_hash')}:
        print("Access denied. Invalid password.")
        sys.exit(1)
    
    # Expiration check using Malaysia timezone
    ${getObfuscatedName('malaysia_tz')} = pytz.timezone('Asia/Kuala_Lumpur')
    ${getObfuscatedName('current_time')} = datetime.datetime.now(${getObfuscatedName('malaysia_tz')})
    ${getObfuscatedName('expiry_time')} = ${getObfuscatedName('malaysia_tz')}.localize(datetime.datetime(${year}, ${month}, ${day}, ${hour}, ${minute}, ${Math.floor(parseFloat(second))}))
    
    if ${getObfuscatedName('current_time')} > ${getObfuscatedName('expiry_time')}:
        print("Script has expired and cannot be executed.")
        sys.exit(1)

# Run authentication and expiration checks
${getObfuscatedName('check_auth')}()

# Original code (obfuscated)
${obfuscatedCode.split('\n').map(line => line.trim() ? line + ' # ' + randomBytes(2).toString('hex') : line).join('\n')}
`;

  return protectedCode;
};

const obfuscateJavaScript = (code: string, password: string, expirationDate: Date): string => {
  // Generate random variable names for obfuscation
  const varMap = new Map<string, string>();
  const getObfuscatedName = (original: string): string => {
    if (!varMap.has(original)) {
      varMap.set(original, '_' + randomBytes(4).toString('hex'));
    }
    return varMap.get(original)!;
  };

  // JavaScript keywords and built-ins to preserve
  const jsKeywords = new Set(['var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined', 'console', 'process', 'require', 'module', 'exports', 'window', 'document', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean']);

  let obfuscatedCode = code;

  // Replace variable declarations
  obfuscatedCode = obfuscatedCode.replace(/\b(var|let|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, keyword, varName) => {
    if (jsKeywords.has(varName)) {
      return match;
    }
    const obfuscated = getObfuscatedName(varName);
    return `${keyword} ${obfuscated}`;
  });

  // Replace function declarations
  obfuscatedCode = obfuscatedCode.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, funcName) => {
    if (jsKeywords.has(funcName)) {
      return match;
    }
    return `function ${getObfuscatedName(funcName)}`;
  });

  // Replace variable usage
  obfuscatedCode = obfuscatedCode.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, varName) => {
    if (jsKeywords.has(varName) || !varMap.has(varName)) {
      return match;
    }
    return getObfuscatedName(varName);
  });

  // Format expiration date for Malaysia timezone (ISO string)
  const malaysiaTime = new Date(expirationDate.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const expiryISO = malaysiaTime.toISOString();

  // Create runtime protection wrapper
  const protectedCode = `// Protected JavaScript Code
(function() {
    'use strict';
    
    function ${getObfuscatedName('checkAuth')}() {
        // Password verification (Node.js environment)
        if (typeof require !== 'undefined') {
            const ${getObfuscatedName('crypto')} = require('crypto');
            const ${getObfuscatedName('readline')} = require('readline');
            
            return new Promise((${getObfuscatedName('resolve')}, ${getObfuscatedName('reject')}) => {
                const ${getObfuscatedName('rl')} = ${getObfuscatedName('readline')}.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                ${getObfuscatedName('rl')}.question('Enter password: ', (${getObfuscatedName('userInput')}) => {
                    ${getObfuscatedName('rl')}.close();
                    
                    const ${getObfuscatedName('expectedHash')} = "${hashPassword(password)}";
                    const ${getObfuscatedName('actualHash')} = ${getObfuscatedName('crypto')}.createHash('sha256').update(${getObfuscatedName('userInput')}).digest('hex');
                    
                    if (${getObfuscatedName('actualHash')} !== ${getObfuscatedName('expectedHash')}) {
                        console.log('Access denied. Invalid password.');
                        process.exit(1);
                    }
                    
                    // Expiration check using Malaysia timezone
                    const ${getObfuscatedName('currentTime')} = new Date();
                    const ${getObfuscatedName('malaysiaTime')} = new Date(${getObfuscatedName('currentTime')}.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
                    const ${getObfuscatedName('expiryTime')} = new Date("${expiryISO}");
                    
                    if (${getObfuscatedName('malaysiaTime')} > ${getObfuscatedName('expiryTime')}) {
                        console.log('Script has expired and cannot be executed.');
                        process.exit(1);
                    }
                    
                    ${getObfuscatedName('resolve')}();
                });
            });
        } else {
            // Browser environment
            const ${getObfuscatedName('userInput')} = prompt('Enter password:');
            if (!${getObfuscatedName('userInput')}) {
                alert('Access denied. Password required.');
                return;
            }
            
            // Simple hash for browser (not as secure as Node.js crypto)
            function ${getObfuscatedName('simpleHash')}(${getObfuscatedName('str')}) {
                let ${getObfuscatedName('hash')} = 0;
                for (let ${getObfuscatedName('i')} = 0; ${getObfuscatedName('i')} < ${getObfuscatedName('str')}.length; ${getObfuscatedName('i')}++) {
                    const ${getObfuscatedName('char')} = ${getObfuscatedName('str')}.charCodeAt(${getObfuscatedName('i')});
                    ${getObfuscatedName('hash')} = ((${getObfuscatedName('hash')} << 5) - ${getObfuscatedName('hash')}) + ${getObfuscatedName('char')};
                    ${getObfuscatedName('hash')} = ${getObfuscatedName('hash')} & ${getObfuscatedName('hash')};
                }
                return ${getObfuscatedName('hash')}.toString(16);
            }
            
            const ${getObfuscatedName('expectedSimpleHash')} = "${simpleHash(password)}";
            if (${getObfuscatedName('simpleHash')}(${getObfuscatedName('userInput')}) !== ${getObfuscatedName('expectedSimpleHash')}) {
                alert('Access denied. Invalid password.');
                return;
            }
            
            // Expiration check
            const ${getObfuscatedName('currentTime')} = new Date();
            const ${getObfuscatedName('malaysiaTime')} = new Date(${getObfuscatedName('currentTime')}.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
            const ${getObfuscatedName('expiryTime')} = new Date("${expiryISO}");
            
            if (${getObfuscatedName('malaysiaTime')} > ${getObfuscatedName('expiryTime')}) {
                alert('Script has expired and cannot be executed.');
                return;
            }
            
            return Promise.resolve();
        }
    }
    
    // Execute protection check and original code
    if (typeof require !== 'undefined') {
        // Node.js environment - async execution
        ${getObfuscatedName('checkAuth')}().then(() => {
            // Original code (obfuscated)
            ${obfuscatedCode.split('\n').map(line => line.trim() ? line + ' //' + randomBytes(2).toString('hex') : line).join('\n            ')}
        }).catch(() => {
            process.exit(1);
        });
    } else {
        // Browser environment - sync execution
        const ${getObfuscatedName('authResult')} = ${getObfuscatedName('checkAuth')}();
        if (${getObfuscatedName('authResult')} instanceof Promise) {
            ${getObfuscatedName('authResult')}.then(() => {
                // Original code (obfuscated)
                ${obfuscatedCode.split('\n').map(line => line.trim() ? line + ' //' + randomBytes(2).toString('hex') : line).join('\n                ')}
            });
        } else {
            // Original code (obfuscated)
            ${obfuscatedCode.split('\n').map(line => line.trim() ? line + ' //' + randomBytes(2).toString('hex') : line).join('\n            ')}
        }
    }
})();
`;

  return protectedCode;
};

// Helper function to create SHA256 hash of password
const hashPassword = (password: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Simple hash function for browser environment
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

export async function createObfuscationJob(input: CreateObfuscationJobInput): Promise<ObfuscationResult> {
  try {
    // Obfuscate the code based on language with runtime protection
    let obfuscatedCode: string;
    switch (input.language) {
      case 'python':
        obfuscatedCode = obfuscatePython(input.code, input.password, input.expiration_date);
        break;
      case 'javascript':
        obfuscatedCode = obfuscateJavaScript(input.code, input.password, input.expiration_date);
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
