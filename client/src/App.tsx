
import { useState } from 'react';
import { CodeObfuscator } from '@/components/CodeObfuscator';
import { FileUploader } from '@/components/FileUploader';
import { DownloadCenter } from '@/components/DownloadCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Code, Upload, Download } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('paste');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔐 Code Obfuscator
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Protect your Python and JavaScript code with password protection and expiration dates.
            Upload files or paste code directly for secure obfuscation.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Code className="h-3 w-3 mr-1" />
              Python
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              <Code className="h-3 w-3 mr-1" />
              JavaScript
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              🕒 Time-based Expiration
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              🔑 Password Protected
            </Badge>
          </div>
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Paste Code
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Obfuscation
                  </CardTitle>
                  <CardDescription>
                    Paste your Python or JavaScript code below to obfuscate it with password protection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeObfuscator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload .py, .js, or .zip files for obfuscation. ZIP files will be processed automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="download" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download Center
                  </CardTitle>
                  <CardDescription>
                    Enter your download token to retrieve your obfuscated code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DownloadCenter />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span>🇲🇾 Malaysia Time Zone</span>
            <span>•</span>
            <span>🔒 Secure Processing</span>
            <span>•</span>
            <span>⚡ Instant Obfuscation</span>
          </div>
          <p>Your code is processed securely and automatically expires based on your settings.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
