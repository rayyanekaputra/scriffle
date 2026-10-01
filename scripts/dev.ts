import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function ensureDatabase() {
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  if (!fs.existsSync(dbPath)) {
    console.log('\n\x1b[33m%s\x1b[0m', '⚡ Database not found at prisma/dev.db — auto-initializing Scriffle database...');
    try {
      execSync('bunx prisma db push', { stdio: 'inherit' });
      execSync('bun run prisma/seed.ts', { stdio: 'inherit' });
      console.log('\x1b[32m%s\x1b[0m\n', '✅ Database created and seeded successfully!');
    } catch (e) {
      console.warn('⚠️  Could not auto-seed database. Please run `bunx prisma db push && bun run prisma/seed.ts` manually.');
    }
  }
}

async function main() {
  ensureDatabase();

  const args = process.argv.slice(2);
  const startFreshIndex = args.findIndex((arg) => arg === '--start-fresh' || arg === '-start-fresh');
  const isStartFresh = startFreshIndex !== -1;

  // Filter out --start-fresh so next dev doesn't complain about unrecognized arguments
  const nextArgs = isStartFresh ? args.filter((_, i) => i !== startFreshIndex) : args;

  const env = { ...process.env };

  if (isStartFresh) {
    try {
      const { createFreshProject } = await import('../src/lib/freshProjectCreator');
      const { prisma } = await import('../src/lib/prisma');
      const freshProject = await createFreshProject();
      const freshToken = Date.now().toString();

      env.NEXT_PUBLIC_START_FRESH_TOKEN = freshToken;
      env.NEXT_PUBLIC_START_FRESH_CANVAS_ID = freshProject.id;

      console.log('\n\x1b[34m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
      console.log('\x1b[1m\x1b[34m%s\x1b[0m', '  🚀 Scriffle [Fresh Project Mode Activated]');
      console.log('  ✨ Created new project: \x1b[32m%s\x1b[0m', freshProject.name);
      console.log('  🆔 Canvas ID: \x1b[36m%s\x1b[0m', freshProject.id);
      console.log('  🎯 Onboarding tour & sandbox missions reset to 0/6');
      console.log('  📁 Existing projects safely preserved in SQLite');
      console.log('\x1b[34m%s\x1b[0m\n', '═══════════════════════════════════════════════════════════════');
      await prisma.$disconnect();
    } catch (err) {
      console.error('⚠️  Failed to create fresh project board:', err);
    }
  }

  // Spawn Next.js dev server
  const child = spawn('next', ['dev', ...nextArgs], {
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
