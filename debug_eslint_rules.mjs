import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

console.log('ESLint Config Recommended Rules:');
for (const [key, value] of Object.entries(eslint.configs.recommended.rules)) {
  if (key.includes('unassigned')) {
    console.log(`eslint.configs.recommended: ${key}: ${value}`);
  }
}

console.log('TypeScript ESLint Recommended Rules:');
tseslint.configs.recommended.forEach((config, index) => {
  if (config.rules) {
    for (const [key, value] of Object.entries(config.rules)) {
      if (key.includes('unassigned')) {
        console.log(`tseslint.configs.recommended[${index}]: ${key}: ${value}`);
      }
    }
  }
});
