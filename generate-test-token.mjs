import jwt from 'jsonwebtoken';

const secret = 'dev-secret-key-change-in-production';

// Create a test JWT
const token = jwt.sign(
  {
    userId: 'test-user-id',
    tenantId: 'test-tenant-id',
    email: 'test@example.com'
  },
  secret,
  { expiresIn: '7d' }
);

console.log('::set-output name=token::' + token);
console.log('Test JWT Token:');
console.log(token);
