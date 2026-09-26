import { spawn } from 'child_process';
import { createFreshProject } from '../src/lib/freshProjectCreator';
import { prisma } from '../src/lib/prisma';

async function main() {
  const args = process.argv.slice(2);
  const startFreshIndex = args.findIndex((arg) => arg === '--start-fresh' || arg === '-start-fresh');
  const isStartFresh = startFreshIndex !== -1;

  // Filter out --start-fresh so next start doesn't complain about unrecognized arguments
  const nextArgs = isStartFresh ? args.filter((_, i) => i !== startFreshIndex) : args;

  const env = { ...process.env };

  if (isStartFresh) {
    try {
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
    } catch (err) {
      console.error('⚠️  Failed to create fresh project board:', err);
    } finally {
      await prisma.$disconnect();
    }
  }

  // Spawn Next.js start server
  const child = spawn('next', ['start', ...nextArgs], {
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
