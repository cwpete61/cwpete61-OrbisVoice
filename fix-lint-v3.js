const fs = require('fs');
const path = require('path');

function fixFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(filePath, content);
}

const authPayloadCast = '(request as unknown as { user: AuthPayload }).user';

// Fix api-keys.ts
fixFile('apps/api/src/routes/api-keys.ts', [
    ['(request as any).user', authPayloadCast],
    ['} as any', '}'],
    [' as any', '']
]);

// Fix google-auth.ts
fixFile('apps/api/src/routes/google-auth.ts', [
    ['(request as any).user', authPayloadCast],
    ['} as any', '}'],
    [' as any', '']
]);

// Fix billing.ts (standardizing)
fixFile('apps/api/src/routes/billing.ts', [
    ['(request.user as AuthPayload)', authPayloadCast]
]);

console.log('Lint fixes v3 applied.');
