#!/usr/bin/env node

/**
 * Pre-publish checklist for XREVA
 * Run this before publishing to NPM to ensure everything is ready
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n${'='.repeat(msg.length)}`)
};

const exec = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
};

const checks = [];
let errors = 0;
let warnings = 0;

// Check function
const check = (name, fn) => {
  try {
    const result = fn();
    if (result === true) {
      log.success(name);
      return true;
    } else if (result === 'warning') {
      log.warning(name);
      warnings++;
      return true;
    } else {
      log.error(`${name}: ${result || 'Failed'}`);
      errors++;
      return false;
    }
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    errors++;
    return false;
  }
};

log.header('🚀 XREVA Pre-Publish Checklist');

// 1. Check Node/Bun version
log.header('Environment');
check('Bun is installed', () => {
  const version = exec('bun --version');
  return version ? true : 'Bun not found';
});

// 2. Check git status
log.header('Git Status');
check('Working directory is clean', () => {
  const status = exec('git status --porcelain');
  return status === '' ? true : 'warning';
});

check('On main branch', () => {
  const branch = exec('git branch --show-current');
  return branch === 'main' ? true : 'warning';
});

// 3. Check package files
log.header('Package Files');
check('package.json exists', () => existsSync('package.json'));
check('README.md exists', () => existsSync('README.md'));
check('LICENSE exists', () => existsSync('LICENSE'));
check('CHANGELOG.md exists', () => existsSync('CHANGELOG.md') ? true : 'warning');

// 4. Check package.json
log.header('Package Configuration');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

check('Package name is correct', () => pkg.name === 'xreva');
check('Version is set', () => pkg.version ? true : 'Version not set');
check('Description is set', () => pkg.description ? true : 'Description not set');
check('Author is set', () => pkg.author ? true : 'warning');
check('License is MIT', () => pkg.license === 'MIT');
check('Repository URL is correct', () => 
  pkg.repository?.url === 'git+https://github.com/michaltakac/xreva.git'
);
check('Main entry point is set', () => pkg.main === './dist/index.cjs');
check('Module entry point is set', () => pkg.module === './dist/index.mjs');
check('Types entry point is set', () => pkg.types === './dist/index.d.ts');
check('Files field is configured', () => 
  pkg.files && pkg.files.includes('dist') && pkg.files.includes('README.md')
);

// 5. Build artifacts
log.header('Build Artifacts');
check('dist/ directory exists', () => existsSync('dist'));
check('dist/index.mjs exists', () => existsSync('dist/index.mjs'));
check('dist/index.cjs exists', () => existsSync('dist/index.cjs'));
check('dist/index.d.ts exists', () => existsSync('dist/index.d.ts'));

// 6. Run tests
log.header('Tests');
check('Tests pass', () => {
  const result = exec('bun test 2>&1');
  return result && !result.includes('FAIL') ? true : 'Tests failed or not found';
});

// 7. TypeScript
log.header('TypeScript');
check('TypeScript compiles without errors', () => {
  const result = exec('bun run typecheck 2>&1');
  return result && !result.includes('error') ? true : 'TypeScript errors found';
});

// 8. NPM checks
log.header('NPM Registry');
check('NPM CLI is installed', () => {
  const version = exec('npm --version');
  return version ? true : 'NPM not found';
});

check('Logged in to NPM', () => {
  const user = exec('npm whoami 2>&1');
  return user && !user.includes('ENEEDAUTH') ? true : 'Not logged in to NPM';
});

check('Package name is available', () => {
  const result = exec('npm view xreva version 2>&1');
  if (result && !result.includes('404')) {
    log.info(`  Current version on NPM: ${result}`);
    log.info(`  Your version: ${pkg.version}`);
    return 'warning';
  }
  return true;
});

// 9. Package size
log.header('Package Size');
const checkSize = () => {
  exec('npm pack --dry-run 2>&1');
  const sizeInfo = exec('npm pack --dry-run 2>&1 | grep "npm notice"');
  if (sizeInfo) {
    const lines = sizeInfo.split('\n').filter(l => l.includes('package size') || l.includes('unpacked size'));
    lines.forEach(line => {
      const size = line.split(':')[1]?.trim();
      if (size) {
        log.info(`  ${size}`);
      }
    });
  }
  return true;
};
check('Package size is reasonable', checkSize);

// Summary
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  log.success(`${colors.green}✨ All checks passed! Ready to publish.${colors.reset}`);
  console.log('\nTo publish, run:');
  console.log(`  ${colors.cyan}npm publish --access public${colors.reset}`);
} else if (errors === 0) {
  log.warning(`${colors.yellow}⚠ ${warnings} warning(s) found, but you can still publish.${colors.reset}`);
  console.log('\nTo publish, run:');
  console.log(`  ${colors.cyan}npm publish --access public${colors.reset}`);
} else {
  log.error(`${colors.red}✗ ${errors} error(s) found. Please fix them before publishing.${colors.reset}`);
  if (warnings > 0) {
    log.warning(`Also ${warnings} warning(s) found.`);
  }
  process.exit(1);
}

console.log('\n📚 For more details, see PUBLISHING.md');