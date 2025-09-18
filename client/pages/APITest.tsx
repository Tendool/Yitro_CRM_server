import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthDebugger } from "@/components/AuthDebugger";

export default function APITest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testAPI = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Basic connectivity
      addResult("Testing basic connectivity...");

      try {
        const response = await fetch("/api/ping", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        addResult(`Ping response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const text = await response.text();
          addResult(`Ping response body: ${text}`);
        }
      } catch (error) {
        addResult(`Ping failed: ${error}`);
      }

      // Test 2: Auth endpoint connectivity
      addResult("Testing auth endpoint...");

      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", password: "test" }),
        });
        addResult(`Auth response: ${response.status} ${response.statusText}`);

        const text = await response.text();
        addResult(`Auth response body: ${text.substring(0, 200)}`);
      } catch (error) {
        addResult(`Auth test failed: ${error}`);
      }

      // Test 3: Check if backend is running
      addResult("Testing backend availability...");

      try {
        const response = await fetch("/api", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        addResult(
          `Backend response: ${response.status} ${response.statusText}`,
        );
      } catch (error) {
        addResult(`Backend test failed: ${error}`);
      }

      // Test 4: Environment check
      addResult("Environment info:");
      addResult(`Current URL: ${window.location.href}`);
      addResult(`User Agent: ${navigator.userAgent.substring(0, 100)}`);
    } catch (error) {
      addResult(`General error: ${error}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Connectivity Test</h1>

        <Button onClick={testAPI} disabled={loading} className="mb-6">
          {loading ? "Testing..." : "Run API Tests"}
        </Button>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-2 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-500">
                Click "Run API Tests" to start testing
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Issues:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• If ping fails: Backend server is not running</li>
            <li>• If auth returns 404: Auth routes not properly configured</li>
            <li>• If auth returns 500: Database connection issue</li>
            <li>• If CORS errors: Cross-origin request blocked</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
