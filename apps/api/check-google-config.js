const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/orbisvoice?schema=public'
    }
  }
});

async function main() {
  try {
    const config = await prisma.googleAuthConfig.findUnique({
      where: { id: 'google-auth-config' }
    });
    
    console.log('GoogleAuthConfig:', JSON.stringify(config, null, 2));
    
    if (!config) {
      console.log('\nNo GoogleAuthConfig found in database!');
    } else {
      console.log('\nConfig Summary:');
      console.log('- Client ID:', config.clientId || 'MISSING');
      console.log('- Client ID length:', config.clientId ? config.clientId.length : 0);
      console.log('- Client Secret:', config.clientSecret ? '[SET]' : 'MISSING');
      console.log('- Redirect URI:', config.redirectUri || 'MISSING');
      console.log('- Enabled:', config.enabled);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
