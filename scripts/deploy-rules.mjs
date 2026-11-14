import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Generates ephemeral Firebase rules and config with ADMIN_UID stamped from .env,
 * runs `firebase deploy --only firestore:rules,storage`, and cleans up temporary
 * files so tracked rules in Git never retain hardcoded secrets.
 */
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');

if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found. Copy .env.example to .env and set ADMIN_UID.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/^ADMIN_UID=(.+)$/m);
const rawUid = match ? match[1].trim() : '';
const adminUid = rawUid.replace(/^["']|["']$/g, '');

if (!adminUid || adminUid === 'your_firebase_admin_uid_here') {
  console.error('Error: ADMIN_UID is not configured in .env.');
  process.exit(1);
}

if (!/^[a-zA-Z0-9_-]{20,128}$/.test(adminUid)) {
  console.error('Error: ADMIN_UID has invalid format. Expected 20-128 alphanumeric/-/_ characters.');
  process.exit(1);
}

const tempFiles = [];
const tempFirestoreRules = '.firestore.rules.deploy';
const tempStorageRules = '.storage.rules.deploy';
const tempFirebaseConfig = '.firebase.deploy.json';

try {
  for (const [srcName, destName] of [
    ['firestore.rules', tempFirestoreRules],
    ['storage.rules', tempStorageRules],
  ]) {
    const srcContent = fs.readFileSync(path.resolve(rootDir, srcName), 'utf-8');
    const rendered = srcContent.replaceAll('ADMIN_UID_ENV_PLACEHOLDER', adminUid);
    const destPath = path.resolve(rootDir, destName);
    fs.writeFileSync(destPath, rendered, 'utf-8');
    tempFiles.push(destPath);
  }

  const baseConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootDir, 'firebase.json'), 'utf-8')
  );
  const deployConfig = {
    ...baseConfig,
    firestore: {
      ...baseConfig.firestore,
      rules: tempFirestoreRules,
    },
    storage: {
      ...baseConfig.storage,
      rules: tempStorageRules,
    },
  };
  const tempConfigPath = path.resolve(rootDir, tempFirebaseConfig);
  fs.writeFileSync(tempConfigPath, JSON.stringify(deployConfig, null, 2), 'utf-8');
  tempFiles.push(tempConfigPath);

  execFileSync(
    'firebase',
    ['deploy', '--config', tempFirebaseConfig, '--only', 'firestore:rules,storage'],
    { stdio: 'inherit' }
  );
} finally {
  for (const filePath of tempFiles) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
