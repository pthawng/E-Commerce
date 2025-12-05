/**
 * Test Connection Component
 * Component để test kết nối với Backend API
 */
import { useState } from 'react';
import { useMe } from '@/services/queries';
import { useLogin } from '@/services/mutations';
import { useAuthStore } from '@/store/auth.store';
import { API_BASE_URL } from '@shared/config';

export function TestConnection() {
  const [testResult, setTestResult] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Chỉ fetch user khi đã authenticated
  const { data: user, isLoading: isLoadingUser, error: userError } = useMe();
  const login = useLogin();
  const { isAuthenticated, user: authUser, clearAuth } = useAuthStore();

  const testApiConnection = async () => {
    try {
      setTestResult('Testing connection...');
      const response = await fetch(`${API_BASE_URL}/api`);
      const data = await response.json();
      setTestResult(`✅ Connection OK! Status: ${response.status}`);
      console.log('API Response:', data);
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Connection error:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      setTestResult('✅ Login successful!');
    } catch (error) {
      setTestResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Test Backend Connection</h2>
      
      {/* API URL Info */}
      <div className="p-4 bg-gray-100 rounded">
        <p className="font-semibold">API Base URL:</p>
        <p className="text-sm text-gray-600">{API_BASE_URL}</p>
      </div>

      {/* Test Connection Button */}
      <div>
        <button
          onClick={testApiConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Connection
        </button>
        {testResult && (
          <p className="mt-2 text-sm">{testResult}</p>
        )}
      </div>

      {/* Auth Status */}
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Authentication Status:</h3>
        <p>Is Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        {authUser && (
          <p>User: {authUser.email} ({authUser.fullName})</p>
        )}
      </div>

      {/* Login Form */}
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="p-4 border rounded space-y-4">
          <h3 className="font-semibold">Login Test</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={login.isPending}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {login.isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      ) : (
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Logged In</h3>
          <button
            onClick={clearAuth}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Test useMe Query */}
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Test useMe Query:</h3>
        {isLoadingUser && <p>Loading user...</p>}
        {userError && (
          <p className="text-red-500">
            Error: {userError instanceof Error ? userError.message : 'Unknown error'}
          </p>
        )}
        {user && (
          <div>
            <p>✅ User loaded:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

