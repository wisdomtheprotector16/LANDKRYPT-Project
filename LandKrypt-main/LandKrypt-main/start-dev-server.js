// Development Server Starter
// Starts the Next.js development server and handles any startup issues

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevServerStarter {
  constructor() {
    this.serverProcess = null;
    this.isRunning = false;
  }

  async startServer() {
    console.log('🚀 Starting LandKrypt Development Server...\n');
    console.log('='.repeat(50));

    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Start the server
      await this.launchNextServer();
      
    } catch (error) {
      console.error('\n❌ Failed to start development server:', error);
      throw error;
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if package.json exists
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('⚠️  node_modules not found, please run npm install');
      throw new Error('Dependencies not installed');
    }

    // Check if Next.js is installed
    const nextPath = path.join(__dirname, 'node_modules', '.bin', 'next');
    const nextPathCmd = path.join(__dirname, 'node_modules', '.bin', 'next.cmd');
    if (!fs.existsSync(nextPath) && !fs.existsSync(nextPathCmd)) {
      throw new Error('Next.js not found in node_modules');
    }

    console.log('✅ Prerequisites check passed');
  }

  async launchNextServer() {
    console.log('\n🌐 Launching Next.js development server...');
    
    return new Promise((resolve, reject) => {
      // Use the Next.js binary directly
      const nextBin = process.platform === 'win32' ? 'next.cmd' : 'next';
      const nextPath = path.join(__dirname, 'node_modules', '.bin', nextBin);
      
      console.log(`Using Next.js binary: ${nextPath}`);
      
      this.serverProcess = spawn(nextPath, ['dev', '--port', '3000'], {
        cwd: __dirname,
        stdio: 'pipe',
        shell: process.platform === 'win32'
      });

      let output = '';
      let hasStarted = false;

      this.serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
        
        // Check if server has started
        if (text.includes('Ready') || text.includes('started server') || text.includes('Local:')) {
          if (!hasStarted) {
            hasStarted = true;
            this.isRunning = true;
            console.log('\n✅ Development server started successfully!');
            console.log('🌐 Open http://localhost:3000 in your browser');
            resolve();
          }
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const text = data.toString();
        process.stderr.write(text);
        
        // Check for common errors
        if (text.includes('EADDRINUSE')) {
          console.error('\n❌ Port 3000 is already in use');
          reject(new Error('Port already in use'));
        } else if (text.includes('Module not found')) {
          console.error('\n❌ Missing dependencies');
          reject(new Error('Missing dependencies'));
        }
      });

      this.serverProcess.on('error', (error) => {
        console.error('\n❌ Failed to start server:', error.message);
        reject(error);
      });

      this.serverProcess.on('close', (code) => {
        this.isRunning = false;
        if (code !== 0 && !hasStarted) {
          console.error(`\n❌ Server process exited with code ${code}`);
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!hasStarted) {
          console.error('\n⏰ Server startup timed out');
          this.stopServer();
          reject(new Error('Server startup timeout'));
        }
      }, 60000);
    });
  }

  stopServer() {
    if (this.serverProcess && this.isRunning) {
      console.log('\n🛑 Stopping development server...');
      this.serverProcess.kill();
      this.isRunning = false;
    }
  }

  // Handle graceful shutdown
  setupGracefulShutdown() {
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
      this.stopServer();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
      this.stopServer();
      process.exit(0);
    });
  }
}

// Execute server startup
async function main() {
  const starter = new DevServerStarter();
  starter.setupGracefulShutdown();
  
  try {
    await starter.startServer();
    
    // Keep the process alive
    console.log('\n📝 Server is running. Press Ctrl+C to stop.');
    
    // Keep process alive
    setInterval(() => {
      if (!starter.isRunning) {
        console.log('❌ Server stopped unexpectedly');
        process.exit(1);
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DevServerStarter };
