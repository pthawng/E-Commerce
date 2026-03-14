import axios from 'axios';

async function testRateLimit() {
  const url = 'http://localhost:4000/auth/login';
  const limit = 10;
  
  console.log(`Starting rate limit test for ${url}...`);
  
  for (let i = 1; i <= limit + 2; i++) {
    try {
      const response = await axios.post(url, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log(`Request ${i}: Success (Status: ${response.status})`);
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i}: Failed (Status: ${error.response.status}, Message: ${error.response.data.message})`);
      } else {
        console.log(`Request ${i}: Error (${error.message})`);
      }
    }
  }
}

testRateLimit();
