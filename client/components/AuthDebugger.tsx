import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthDebugger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState("admin@yitro.com");
  const [password, setPassword] = useState("admin123");

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectAuth = async () => {
    setLogs([]);
    addLog("🔍 Starting direct authentication test...");
    
    try {
      // Test 1: Basic connectivity
      addLog("1️⃣ Testing basic connectivity...");
      const pingUrl = "/api/ping";
      addLog(`Making request to: ${pingUrl}`);
      
      const pingResponse = await fetch(pingUrl);
      addLog(`Ping response: ${pingResponse.status} ${pingResponse.statusText}`);
      addLog(`Ping URL: ${pingResponse.url}`);
      addLog(`Ping redirected: ${pingResponse.redirected}`);
      
      if (pingResponse.ok) {
        const pingData = await pingResponse.text();
        addLog(`Ping data: ${pingData}`);
      }

      // Test 2: Auth endpoint
      addLog("2️⃣ Testing authentication endpoint...");
      const authUrl = "/api/auth/signin";
      addLog(`Making auth request to: ${authUrl}`);
      addLog(`Request body: ${JSON.stringify({ email, password: "***" })}`);
      
      const authResponse = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      addLog(`Auth response: ${authResponse.status} ${authResponse.statusText}`);
      addLog(`Auth URL: ${authResponse.url}`);
      addLog(`Auth redirected: ${authResponse.redirected}`);
      addLog(`Auth headers: ${JSON.stringify(Object.fromEntries(authResponse.headers.entries()))}`);

      if (authResponse.ok) {
        const authData = await authResponse.text();
        addLog(`Auth success: ${authData.substring(0, 200)}...`);
      } else {
        const errorData = await authResponse.text();
        addLog(`Auth error: ${errorData}`);
      }

      // Test 3: Environment info
      addLog("3️⃣ Environment information:");
      addLog(`Current URL: ${window.location.href}`);
      addLog(`Origin: ${window.location.origin}`);
      addLog(`Protocol: ${window.location.protocol}`);
      addLog(`Host: ${window.location.host}`);
      addLog(`User Agent: ${navigator.userAgent.substring(0, 100)}...`);
      
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error("Auth debug error:", error);
    }
  };

  const testProviderAuth = async () => {
    setLogs([]);
    addLog("🔍 Testing RealAuthProvider signIn...");
    
    try {
      // Import and use the actual auth provider
      const { useAuth } = await import("@/components/RealAuthProvider");
      addLog("Provider imported successfully");
      
      // Note: This would need to be called from within the provider context
      addLog("⚠️ Provider auth test needs to be run from a component wrapped in RealAuthProvider");
      
    } catch (error) {
      addLog(`❌ Provider test error: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔐 Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yitro.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <Input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testDirectAuth}>
            🧪 Test Direct Auth
          </Button>
          <Button onClick={testProviderAuth} variant="outline">
            🔗 Test Provider Auth
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click a test button to start debugging</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-1 bg-white rounded text-xs">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Results:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Ping should return status 200 with {"message\":\"pong"}</li>
            <li>• Auth should return status 200 with user data and JWT token</li>
            <li>• URLs should all point to current domain (no redirects)</li>
            <li>• No fly.dev domains should appear anywhere</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
