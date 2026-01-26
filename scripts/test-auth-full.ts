import axios from 'axios';
import { spawn } from 'child_process';
import { join } from 'path';

// Config
const API_URL = 'http://127.0.0.1:3000';
const USERNAME = `testuser_${Date.now()}`;
const PASSWORD = 'testpassword123';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting Full Auth Test...');

  // Start Server
  const server = spawn('bun', ['run', 'src/cli/index.ts', 'serve'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });

  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  await sleep(10000);

  try {
    // 1. Test Local Registration
    console.log('\nTesting Local Registration...');
    try {
      const regRes = await axios.post(`${API_URL}/auth/register`, {
        username: USERNAME,
        password: PASSWORD
      });
      console.log('✅ Registration successful:', regRes.data);
    } catch (err: any) {
      console.error('❌ Registration failed:', err.response?.data || err.message);
      throw err;
    }

    // 2. Test Local Login
    console.log('\nTesting Local Login...');
    let accessToken = '';
    let refreshToken = '';
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        username: USERNAME,
        password: PASSWORD
      });
      console.log('✅ Login successful');
      accessToken = loginRes.data.accessToken;
      refreshToken = loginRes.data.refreshToken;
      if (!accessToken || !refreshToken) throw new Error('Tokens missing');
    } catch (err: any) {
      console.error('❌ Login failed:', err.response?.data || err.message);
      throw err;
    }

    // 3. Test Protected Route
    console.log('\nTesting Protected Route (/auth/me)...');
    try {
      const meRes = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Protected route access successful:', meRes.data);
    } catch (err: any) {
      console.error('❌ Protected route failed:', err.response?.data || err.message);
      throw err;
    }

    console.log('\n🎉 All Auth Tests Passed!');
  } catch (error) {
    console.error('\n❌ Test Suite Failed');
    process.exit(1);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTest();
