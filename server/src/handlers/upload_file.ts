import { db } from '../db';
import { obfuscationJobsTable } from '../db/schema';
import { type FileUploadInput, type ObfuscationResult } from '../schema';
import { randomBytes } from 'crypto';

// Try to import AdmZip, fallback to null if not available
let AdmZip: any = null;
try {
  AdmZip = require('adm-zip');
} catch (error) {
  console.warn('adm-zip not found. Zip file processing will be unavailable. Install with: npm install adm-zip');
}

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
  return Math.abs(hash).toString(16);
};

// Generate random identifier for obfuscation
const generateObfuscatedName = (): string => {
  return '_' + randomBytes(4).toString('hex');
};

// Enhanced Python obfuscation with runtime protection
const obfuscatePython = (code: string, password: string, expirationDate: Date): string => {
  // Generate random variable names for obfuscation
  const varMap = new Map<string, string>();
  const getObfuscatedName = (original: string): string => {
    if (!varMap.has(original)) {
      varMap.set(original, generateObfuscatedName());
    }
    return varMap.get(original)!;
  };

  // Python keywords and built-ins to preserve
  const pythonReserved = new Set([
    // Keywords
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 
    'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 
    'raise', 'return', 'try', 'while', 'with', 'yield',
    // Common built-ins
    'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 
    'input', 'open', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr', 'min', 'max',
    'sum', 'all', 'any', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
    // System modules
    'sys', 'os', 'datetime', 'hashlib', 'pytz'
  ]);
  
  let obfuscatedCode = code;
  
  // Replace user-defined function definitions
  obfuscatedCode = obfuscatedCode.replace(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, funcName) => {
    if (pythonReserved.has(funcName)) {
      return match;
    }
    return match.replace(funcName, getObfuscatedName(funcName));
  });

  // Replace class definitions
  obfuscatedCode = obfuscatedCode.replace(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, className) => {
    if (pythonReserved.has(className)) {
      return match;
    }
    return match.replace(className, getObfuscatedName(className));
  });

  // Replace variable assignments (simple pattern)
  obfuscatedCode = obfuscatedCode.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm, (match, indent, varName) => {
    if (pythonReserved.has(varName)) {
      return match;
    }
    return `${indent}${getObfuscatedName(varName)} =`;
  });

  // Replace variable usage in common contexts
  obfuscatedCode = obfuscatedCode.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, varName) => {
    if (pythonReserved.has(varName) || !varMap.has(varName)) {
      return match;
    }
    return getObfuscatedName(varName);
  });

  // Format expiration date for Malaysia timezone
  const malaysiaDate = expirationDate.toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' });
  const [datePart, timePart] = malaysiaDate.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');

  // Generate obfuscated variable names for protection functions
  const checkAuthFunc = generateObfuscatedName();
  const userInputVar = generateObfuscatedName();
  const expectedHashVar = generateObfuscatedName();
  const actualHashVar = generateObfuscatedName();
  const malaysiaTzVar = generateObfuscatedName();
  const currentTimeVar = generateObfuscatedName();
  const expiryTimeVar = generateObfuscatedName();

  // Create runtime protection wrapper
  const protectedCode = `#!/usr/bin/env python3
# Protected Python Script - Generated Code
import sys
import hashlib
import datetime
try:
    import pytz
except ImportError:
    print("Error: pytz module is required. Install with: pip install pytz")
    sys.exit(1)

def ${checkAuthFunc}():
    # Password verification
    ${userInputVar} = input("Enter password: ")
    ${expectedHashVar} = "${hashPassword(password)}"
    ${actualHashVar} = hashlib.sha256(${userInputVar}.encode()).hexdigest()
    
    if ${actualHashVar} != ${expectedHashVar}:
        print("Access denied. Invalid password.")
        sys.exit(1)
    
    # Expiration check using Malaysia timezone
    ${malaysiaTzVar} = pytz.timezone('Asia/Kuala_Lumpur')
    ${currentTimeVar} = datetime.datetime.now(${malaysiaTzVar})
    ${expiryTimeVar} = ${malaysiaTzVar}.localize(datetime.datetime(${year}, ${month}, ${day}, ${hour}, ${minute}, 0))
    
    if ${currentTimeVar} > ${expiryTimeVar}:
        print("Script has expired and cannot be executed.")
        sys.exit(1)

# Run authentication and expiration checks
${checkAuthFunc}()

# Original code (obfuscated)
${obfuscatedCode.split('\n').map(line => {
  if (line.trim()) {
    return line + '  # ' + randomBytes(2).toString('hex');
  }
  return line;
}).join('\n')}
`;

  return protectedCode;
};

// Enhanced JavaScript obfuscation with runtime protection
const obfuscateJavaScript = (code: string, password: string, expirationDate: Date): string => {
  // Generate random variable names for obfuscation
  const varMap = new Map<string, string>();
  const getObfuscatedName = (original: string): string => {
    if (!varMap.has(original)) {
      varMap.set(original, generateObfuscatedName());
    }
    return varMap.get(original)!;
  };

  // JavaScript keywords and built-ins to preserve
  const jsReserved = new Set([
    // Keywords
    'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'do', 'switch', 
    'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally', 
    'throw', 'new', 'this', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 
    'null', 'undefined',
    // Built-ins
    'console', 'process', 'require', 'module', 'exports', 'window', 'document', 
    'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Math', 'JSON',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'alert', 'prompt', 'confirm',
    // Common globals
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
  ]);

  let obfuscatedCode = code;

  // Replace function declarations
  obfuscatedCode = obfuscatedCode.replace(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, funcName) => {
    if (jsReserved.has(funcName)) {
      return match;
    }
    return `function ${getObfuscatedName(funcName)}`;
  });

  // Replace variable declarations
  obfuscatedCode = obfuscatedCode.replace(/\b(var|let|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, keyword, varName) => {
    if (jsReserved.has(varName)) {
      return match;
    }
    return `${keyword} ${getObfuscatedName(varName)}`;
  });

  // Replace property assignments (simple pattern)
  obfuscatedCode = obfuscatedCode.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, (match, propName) => {
    if (jsReserved.has(propName)) {
      return match;
    }
    return `.${getObfuscatedName(propName)} =`;
  });

  // Replace variable usage
  obfuscatedCode = obfuscatedCode.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, varName) => {
    if (jsReserved.has(varName) || !varMap.has(varName)) {
      return match;
    }
    return getObfuscatedName(varName);
  });

  // Format expiration date for Malaysia timezone (ISO string)
  const expiryISO = expirationDate.toISOString();

  // Generate obfuscated variable names for protection functions
  const checkAuthFunc = generateObfuscatedName();
  const cryptoVar = generateObfuscatedName();
  const readlineVar = generateObfuscatedName();
  const resolveVar = generateObfuscatedName();
  const rejectVar = generateObfuscatedName();
  const rlVar = generateObfuscatedName();
  const userInputVar = generateObfuscatedName();
  const expectedHashVar = generateObfuscatedName();
  const actualHashVar = generateObfuscatedName();
  const currentTimeVar = generateObfuscatedName();
  const malaysiaTimeVar = generateObfuscatedName();
  const expiryTimeVar = generateObfuscatedName();
  const simpleHashFunc = generateObfuscatedName();
  const hashVar = generateObfuscatedName();
  const iVar = generateObfuscatedName();
  const charVar = generateObfuscatedName();
  const strVar = generateObfuscatedName();
  const expectedSimpleHashVar = generateObfuscatedName();
  const authResultVar = generateObfuscatedName();

  // Create runtime protection wrapper
  const protectedCode = `// Protected JavaScript Code - Generated Code
(function() {
    'use strict';
    
    function ${checkAuthFunc}() {
        // Check environment and handle accordingly
        if (typeof require !== 'undefined' && typeof process !== 'undefined') {
            // Node.js environment
            const ${cryptoVar} = require('crypto');
            const ${readlineVar} = require('readline');
            
            return new Promise((${resolveVar}, ${rejectVar}) => {
                const ${rlVar} = ${readlineVar}.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                ${rlVar}.question('Enter password: ', (${userInputVar}) => {
                    ${rlVar}.close();
                    
                    // Password verification
                    const ${expectedHashVar} = "${hashPassword(password)}";
                    const ${actualHashVar} = ${cryptoVar}.createHash('sha256').update(${userInputVar}).digest('hex');
                    
                    if (${actualHashVar} !== ${expectedHashVar}) {
                        console.log('Access denied. Invalid password.');
                        process.exit(1);
                    }
                    
                    // Expiration check using Malaysia timezone
                    const ${currentTimeVar} = new Date();
                    const ${malaysiaTimeVar} = new Date(${currentTimeVar}.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
                    const ${expiryTimeVar} = new Date("${expiryISO}");
                    
                    if (${malaysiaTimeVar} > ${expiryTimeVar}) {
                        console.log('Script has expired and cannot be executed.');
                        process.exit(1);
                    }
                    
                    ${resolveVar}();
                });
            });
        } else {
            // Browser environment
            const ${userInputVar} = prompt('Enter password:');
            if (!${userInputVar}) {
                alert('Access denied. Password required.');
                return;
            }
            
            // Simple hash function for browser
            function ${simpleHashFunc}(${strVar}) {
                let ${hashVar} = 0;
                for (let ${iVar} = 0; ${iVar} < ${strVar}.length; ${iVar}++) {
                    const ${charVar} = ${strVar}.charCodeAt(${iVar});
                    ${hashVar} = ((${hashVar} << 5) - ${hashVar}) + ${charVar};
                    ${hashVar} = ${hashVar} & ${hashVar};
                }
                return Math.abs(${hashVar}).toString(16);
            }
            
            // Password verification
            const ${expectedSimpleHashVar} = "${simpleHash(password)}";
            if (${simpleHashFunc}(${userInputVar}) !== ${expectedSimpleHashVar}) {
                alert('Access denied. Invalid password.');
                return;
            }
            
            // Expiration check
            const ${currentTimeVar} = new Date();
            const ${malaysiaTimeVar} = new Date(${currentTimeVar}.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
            const ${expiryTimeVar} = new Date("${expiryISO}");
            
            if (${malaysiaTimeVar} > ${expiryTimeVar}) {
                alert('Script has expired and cannot be executed.');
                return;
            }
            
            return Promise.resolve();
        }
    }
    
    // Execute protection check and original code
    if (typeof require !== 'undefined' && typeof process !== 'undefined') {
        // Node.js environment - async execution
        ${checkAuthFunc}().then(() => {
            // Original code (obfuscated)
${obfuscatedCode.split('\n').map(line => {
  if (line.trim()) {
    return '            ' + line + ' //' + randomBytes(2).toString('hex');
  }
  return line;
}).join('\n')}
        }).catch(() => {
            process.exit(1);
        });
    } else {
        // Browser environment - sync execution
        const ${authResultVar} = ${checkAuthFunc}();
        if (${authResultVar} instanceof Promise) {
            ${authResultVar}.then(() => {
                // Original code (obfuscated)
${obfuscatedCode.split('\n').map(line => {
  if (line.trim()) {
    return '                ' + line + ' //' + randomBytes(2).toString('hex');
  }
  return line;
}).join('\n')}
            });
        } else {
            // Original code (obfuscated)
${obfuscatedCode.split('\n').map(line => {
  if (line.trim()) {
    return '            ' + line + ' //' + randomBytes(2).toString('hex');
  }
  return line;
}).join('\n')}
        }
    }
})();
`;

  return protectedCode;
};

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

// Process individual file and create obfuscation job
async function processFile(
  filename: string, 
  content: string, 
  password: string, 
  expirationDate: Date
): Promise<ObfuscationResult> {
  // Detect language from filename
  const language = detectLanguageFromFilename(filename);
  if (!language) {
    throw new Error(`Could not detect programming language from filename: ${filename}`);
  }

  // Validate content
  if (!content.trim()) {
    throw new Error(`File ${filename} is empty or contains only whitespace`);
  }

  // Obfuscate the code based on language with runtime protection
  let obfuscatedCode: string;
  if (language === 'python') {
    obfuscatedCode = obfuscatePython(content, password, expirationDate);
  } else {
    obfuscatedCode = obfuscateJavaScript(content, password, expirationDate);
  }

  // Generate unique download token
  const downloadToken = randomBytes(32).toString('hex');

  // Calculate expires_at (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Insert obfuscation job into database
  const result = await db.insert(obfuscationJobsTable)
    .values({
      original_filename: filename,
      language: language,
      password: password,
      expiration_date: expirationDate,
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
}

export async function uploadFile(input: FileUploadInput): Promise<ObfuscationResult> {
  try {
    // Validate file type
    if (!validateFileType(input.filename)) {
      throw new Error('Unsupported file type. Only .py, .js, and .zip files are allowed.');
    }

    // Validate password
    if (!input.password.trim()) {
      throw new Error('Password is required');
    }

    // Handle zip files
    if (input.filename.toLowerCase().endsWith('.zip')) {
      if (!AdmZip) {
        throw new Error('Zip file processing is not available. Please install the adm-zip dependency: npm install adm-zip');
      }
      
      try {
        // Decode base64 content to buffer for zip processing
        const zipBuffer = Buffer.from(input.content, 'base64');
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        const supportedFiles: { filename: string; content: string }[] = [];

        // Extract supported files from zip
        zipEntries.forEach((entry: any) => {
          if (!entry.isDirectory) {
            const filename = entry.entryName;
            const language = detectLanguageFromFilename(filename);
            
            if (language) {
              const content = entry.getData('utf8');
              if (content.trim()) {
                supportedFiles.push({ filename, content });
              }
            }
          }
        });

        if (supportedFiles.length === 0) {
          throw new Error('No supported files (.py or .js) found in the zip archive, or all files are empty');
        }

        // Process each supported file and create separate obfuscation jobs
        const results: ObfuscationResult[] = [];
        for (const file of supportedFiles) {
          try {
            const result = await processFile(file.filename, file.content, input.password, input.expiration_date);
            results.push(result);
          } catch (fileError) {
            console.error(`Failed to process file ${file.filename}:`, fileError);
            // Continue processing other files, but log the error
          }
        }

        if (results.length === 0) {
          throw new Error('Failed to process any files from the zip archive');
        }

        // Return the first result for consistency with single file uploads
        // In a real application, you might want to modify the API to handle multiple results
        return results[0];
      } catch (zipError) {
        console.error('Failed to process zip file:', zipError);
        throw new Error('Failed to process zip file. Please ensure it\'s a valid zip archive containing .py or .js files.');
      }
    }

    // Handle single files (.py or .js)
    return await processFile(input.filename, input.content, input.password, input.expiration_date);

  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}