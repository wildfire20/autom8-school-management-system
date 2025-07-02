const http = require('http');

function testLogin() {
  const postData = JSON.stringify({
    identifier: 'admin@demo-academy.eud.co',
    password: 'admin123',
    school_domain: 'demo-academy'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

testLogin();
