
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Search, FileDown, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { DownloadRequest, DownloadResponse } from '../../../server/src/schema';

export function DownloadCenter() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DownloadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a download token');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const downloadRequest: DownloadRequest = { token: token.trim() };
      const response = await trpc.downloadObfuscatedCode.query(downloadRequest);
      setResult(response);
    } catch (error) {
      console.error('Failed to download code:', error);
      setError('Invalid or expired token. Please check your token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;

    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageIcon = (language: string) => {
    return language === 'python' ? '🐍' : '🟨';
  };

  const getFileExtension = (filename: string) => {
    return '.' + filename.split('.').pop()?.toLowerCase();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleDownload} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token" className="flex items-center gap-2">
            🎫 Download Token
          </Label>
          <div className="flex gap-2">
            <Input
              id="token"
              placeholder="Enter your download token here..."
              value={token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
              className="font-mono"
              required
            />
            <Button type="submit" disabled={isLoading || !token.trim()}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            💡 Enter the token you received after obfuscating your code
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
      </form>

      {result && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              ✅ File Found!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getLanguageIcon(result.language)}</span>
                <div>
                  <h3 className="font-medium text-blue-900">📄 {result.filename}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {result.language === 'python' ? 'Python' : 'JavaScript'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getFileExtension(result.filename)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={downloadFile}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                📥 Download
              </Button>
            </div>

            <div className="bg-white p-4 rounded-md border border-blue-200">
              <Label className="text-sm font-medium text-blue-800 mb-2 block">
                📄 File Preview:
              </Label>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {result.content.length > 500 
                    ? result.content.substring(0, 500) + '\n... (truncated for preview)'
                    : result.content
                  }
                </pre>
              </div>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <FileDown className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>🎉 Ready to Download!</strong> Click the download button above to save your obfuscated code. 
                The file includes password protection and expiration checks as specified.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            💡 Need Help?
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <span>🎫</span>
              <span>Tokens are provided after successfully obfuscating code in the "Paste Code" or "Upload Files" tabs.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>⏰</span>
              <span>Download tokens expire based on the expiration date you set during obfuscation.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🔒</span>
              <span>Downloaded files will prompt for the password you specified and check expiration dates at runtime.</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🇲🇾</span>
              <span>All expiration times are in Malaysia Time Zone (UTC+8).</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
