const fs = require('fs');
const path = require('path');

const filesToFix = [
  'deploy.sh',
  'setup-webhook.sh',
  'deploy-vps-direct.sh',
  'webhook-server.js'
];

filesToFix.forEach(file => {
  const absolutePath = path.resolve(__dirname, file);
  if (fs.existsSync(absolutePath)) {
    const content = fs.readFileSync(absolutePath, 'utf8');
    const fixedContent = content.replace(/\r\n/g, '\n');
    fs.writeFileSync(absolutePath, fixedContent, { encoding: 'utf8', mode: 0o755 });
    console.log(`Fixed line endings for: ${file}`);
  }
});
