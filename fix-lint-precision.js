const fs = require('fs');

function fixFile(filePath, search, replace) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(filePath, content);
}

// Fix google-auth.ts config types
const search1 = /config = await prisma\.googleAuthConfig\.findUnique\(\{[\s\S]*?\}\);/g;
const replace1 = `config = await prisma.googleAuthConfig.findUnique({
          where: { id: "google-auth-config" },
        }) as any;`;

fixFile('apps/api/src/routes/google-auth.ts', search1, replace1);

// Fix users.ts query errors
const search2 = /query\.userId/g;
const replace2 = '(query as any).userId';
fixFile('apps/api/src/routes/users.ts', search2, replace2);

const search3 = /query\.tenantId/g;
const replace3 = '(query as any).tenantId';
fixFile('apps/api/src/routes/users.ts', search3, replace3);

console.log('Precision fixes applied.');
