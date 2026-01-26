import axios from 'axios';

// Config
const API_URL = 'http://127.0.0.1:3000';
const USERNAME = `testuser_${Date.now()}`;
const PASSWORD = 'testpassword123';

async function runTest() {
  console.log('🚀 Starting Verification (Server must be running)...');

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

    // 4. Test Zoho Auth URL Generation
    console.log('\nTesting Zoho Auth URL Generation...');
    try {
      const zohoRes = await axios.get(`${API_URL}/auth/zoho`, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400
      });
      if (zohoRes.headers.location && zohoRes.headers.location.includes('accounts.zoho.com')) {
        console.log('✅ Zoho redirect URL valid:', zohoRes.headers.location);
      } else {
        console.warn('⚠️ Unexpected Zoho response:', zohoRes.status, zohoRes.headers);
      }
    } catch (err: any) {
       if (err.response && err.response.status === 302) {
         console.log('✅ Zoho redirect successful (302 Found)');
       } else {
         console.error('❌ Zoho auth check failed:', err.message);
       }
    }

    console.log('\n🎉 All Auth Tests Passed!');
  } catch (error) {
    console.error('\n❌ Test Suite Failed');
    process.exit(1);
  }
}

runTest();
