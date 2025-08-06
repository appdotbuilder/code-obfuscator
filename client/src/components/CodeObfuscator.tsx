
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lock, Shield, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateObfuscationJobInput, Language, ObfuscationResult } from '../../../server/src/schema';

export function CodeObfuscator() {
  const [formData, setFormData] = useState<CreateObfuscationJobInput>({
    code: '',
    language: 'python',
    password: '',
    expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    original_filename: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ObfuscationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Please enter some code to obfuscate');
      return;
    }
    if (!formData.password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.createObfuscationJob.mutate(formData);
      setResult(response);
      // Reset form
      setFormData(prev => ({
        ...prev,
        code: '',
        password: '',
        original_filename: null
      }));
    } catch (error) {
      console.error('Failed to create obfuscation job:', error);
      setError('Failed to obfuscate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    if (result?.download_token) {
      await navigator.clipboard.writeText(result.download_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Programming Language
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value: Language) =>
                setFormData(prev => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">
                  🐍 Python (.py)
                </SelectItem>
                <SelectItem value="javascript">
                  🟨 JavaScript (.js)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename" className="flex items-center gap-2">
              📄 Original Filename (Optional)
            </Label>
            <Input
              id="filename"
              placeholder="e.g., my_script.py"
              value={formData.original_filename || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, original_filename: e.target.value || null }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-2">
            💻 Code to Obfuscate
          </Label>
          <Textarea
            id="code"
            placeholder={`Enter your ${formData.language === 'python' ? 'Python' : 'JavaScript'} code here...

Example:
${formData.language === 'python' 
  ? 'def hello_world():\n    print("Hello, World!")\n\nhello_world()'
  : 'function helloWorld() {\n    console.log("Hello, World!");\n}\n\nhelloWorld();'
}`}
            value={formData.code}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData(prev => ({ ...prev, code: e.target.value }))
            }
            className="min-h-[300px] font-mono text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Runtime Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password for runtime access"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiration Date (Malaysia Time)
            </Label>
            <Input
              id="expiration"
              type="datetime-local"
              value={formData.expiration_date.toISOString().slice(0, 16)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, expiration_date: new Date(e.target.value) }))
              }
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
          disabled={isLoading || !formData.code.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Obfuscating Code...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              🔐 Obfuscate Code
            </>
          )}
        </Button>
      </form>

      {result && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ✅ Obfuscation Complete!
              </h3>
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
                  <span className="font-medium">Original File:</span>
                  <span className="ml-2">{result.original_filename || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{formatDate(result.created_at)}</span>
                </div>
                <div>
                  <span className="font-medium">Expires:</span>
                  <span className="ml-2 text-orange-600">{formatDate(result.expires_at)}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">🎫 Download Token:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToken}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <code className="block p-2 bg-gray-100 rounded text-sm font-mono break-all">
                  {result.download_token}
                </code>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  💡 <strong>Next Steps:</strong> Copy the token above and use it in the "Download" tab 
                  to retrieve your obfuscated code. The token expires on {formatDate(result.expires_at)}.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
