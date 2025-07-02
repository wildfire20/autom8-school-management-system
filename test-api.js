const http = require('http');

function testAPI() {
  console.log('🧪 Testing AutoM8 School Management API...\n');
  
  // Test main endpoint
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Main endpoint response:', data);
      console.log('✅ Status:', res.statusCode);
      console.log('\n🎉 API test completed! Server is responding.');
    });
  });

  req.on('error', (error) => {
    console.error('❌ API test failed:', error.message);
  });

  req.end();
}

testAPI();
