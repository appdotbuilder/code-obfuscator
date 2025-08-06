
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, File, Calendar, Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { FileUploadInput, ObfuscationResult } from '../../../server/src/schema';

interface FileInfo {
  name: string;
  content: string;
  size: number;
}

export function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [password, setPassword] = useState('');
  const [expirationDate, setExpirationDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ObfuscationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = ['.py', '.js', '.zip'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    try {
      const fileInfos: FileInfo[] = [];
      
      for (const file of files) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!supportedExtensions.includes(extension)) {
          setError(`Unsupported file type: ${file.name}. Supported: .py, .js, .zip`);
          continue;
        }

        const content = await readFileContent(file);
        fileInfos.push({
          name: file.name,
          content,
          size: file.size
        });
      }

      setSelectedFiles(prev => [...prev, ...fileInfos]);
    } catch (error) {
      console.error('Error reading files:', error);
      setError('Failed to read one or more files');
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError(null);
    const newResults: ObfuscationResult[] = [];

    try {
      for (const file of selectedFiles) {
        const uploadInput: FileUploadInput = {
          filename: file.name,
          content: file.content,
          password: password,
          expiration_date: new Date(expirationDate)
        };

        const result = await trpc.uploadFile.mutate(uploadInput);
        newResults.push(result);
      }

      setResults(prev => [...prev, ...newResults]);
      // Reset form
      setSelectedFiles([]);
      setPassword('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      setError('Failed to process files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Select Files
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".py,.js,.zip"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Click to upload files
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Supports .py, .js, and .zip files
              </span>
            </label>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>📁 Selected Files:</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="upload-password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Runtime Password
            </Label>
            <Input
              id="upload-password"
              type="password"
              placeholder="Enter password for runtime access"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-expiration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiration Date (Malaysia Time)
            </Label>
            <Input
              id="upload-expiration"
              type="datetime-local"
              value={expirationDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpirationDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || selectedFiles.length === 0}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Processing Files...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              📁 Process Files ({selectedFiles.length})
            </>
          )}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            ✅ Processing Complete!
          </h3>
          {results.map((result, index) => (
            <Card key={index} className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-green-800">
                    📄 {result.original_filename}
                  </h4>
                  <Badge className="bg-green-100 text-green-700">
                    Job #{result.id}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Language:</span>
                      <Badge variant="secondary" className="ml-2">
                        {result.language === 'python' ? '🐍 Python' : '🟨 JavaScript'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>
                      <span className="ml-2 text-orange-600">{formatDate(result.expires_at)}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border">
                    <Label className="text-xs font-medium text-gray-600 mb-1 block">
                      🎫 Download Token:
                    </Label>
                    <code className="block p-2 bg-gray-100 rounded text-xs font-mono break-all">
                      {result.download_token}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              💡 <strong>Next Steps:</strong> Copy the tokens above and use them in the "Download" tab 
              to retrieve your obfuscated files.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
