import { spawn } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const watchPaths = [
  'auramind-gemini/**/*.{tsx,ts,jsx,js,css,json}',
  'api/**/*',
  'vercel.json'
].filter(Boolean);

const ignorePaths = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/.vercel/**',
  '**/*.log',
  '**/AuraMind/**'
];

let buildTimeout;
let isBuilding = false;
let isDeploying = false;

console.log('🔍 Watching for file changes...');
console.log('📁 Watching paths:', watchPaths.join(', '));
console.log('⏸️  Press Ctrl+C to stop\n');

// Debounced build and deploy function
function buildAndDeploy() {
  if (isBuilding || isDeploying) {
    console.log('⏳ Build or deploy already in progress, skipping...');
    return;
  }

  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(async () => {
    try {
      isBuilding = true;
      console.log('\n🔨 Building AuraMind...');
      
       // Build from the auramind-gemini directory
       const buildProcess = spawn('npm', ['run', 'build'], {
         stdio: 'inherit',
         shell: true,
         cwd: path.join(process.cwd(), 'auramind-gemini')
       });

      await new Promise((resolve, reject) => {
        buildProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('❌ Build failed!');
            isBuilding = false;
            reject(new Error(`Build exited with code ${code}`));
            return;
          }
          resolve();
        });
      });

      isBuilding = false;
      isDeploying = true;
      console.log('✅ Build successful!');
      console.log('🚀 Deploying to Vercel...\n');

      const deployProcess = spawn('vercel', ['--prod'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PATH: process.env.PATH + ';C:\\Users\\wegot\\AppData\\Roaming\\npm' }
      });

      await new Promise((resolve, reject) => {
        deployProcess.on('close', (code) => {
          isDeploying = false;
          if (code !== 0) {
            console.error('❌ Deploy failed!');
            reject(new Error(`Deploy exited with code ${code}`));
            return;
          }
          console.log('✅ Deploy successful!\n');
          console.log('🔍 Watching for changes...\n');
          resolve();
        });
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      isBuilding = false;
      isDeploying = false;
      console.log('🔍 Watching for changes...\n');
    }
  }, 1000); // Wait 1 second after last change before building
}

// Watch for file changes
const watcher = chokidar.watch(watchPaths, {
  ignored: ignorePaths,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

watcher
  .on('add', (filePath) => {
    console.log(`📄 File added: ${path.relative(process.cwd(), filePath)}`);
    buildAndDeploy();
  })
  .on('change', (filePath) => {
    console.log(`📝 File changed: ${path.relative(process.cwd(), filePath)}`);
    buildAndDeploy();
  })
  .on('unlink', (filePath) => {
    console.log(`🗑️  File deleted: ${path.relative(process.cwd(), filePath)}`);
    buildAndDeploy();
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  })
  .on('ready', () => {
    console.log('✅ Watcher ready!\n');
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping watcher...');
  watcher.close();
  process.exit(0);
});
