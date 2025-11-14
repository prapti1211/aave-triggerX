// src/main.ts
import { AaveService } from './services/aave.service';
import { TriggerXService } from './services/triggerx.service';
import { HealthMonitorService } from './services/health-monitor.service';
import { config } from './utils/config';

async function main() {
  console.log('Starting Aave TriggerX Auto Top-Up System');
  console.log(`Monitoring address: ${config.userAddress}`);
  console.log(`Health factor threshold: ${config.healthFactorThreshold}`);

  // Initialize services
  const aaveService = new AaveService();
  const triggerxService = new TriggerXService();
  const healthMonitor = new HealthMonitorService();

  // Start health monitoring API
  healthMonitor.start(3000);

  // Test Aave connection
  const accountData = await aaveService.getUserAccountDetails(config.userAddress);

  // Wait for API to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 1: Initialize Safe Wallet
  try {
    const safeAddress = await triggerxService.initializeSafeWallet();
    console.log('Safe wallet initialized:', safeAddress);
  } catch (error: unknown) {
    console.error('Failed to initialize Safe wallet:', error);
    process.exit(1);
  }

  // Step 2: Create TriggerX automation job
  try {
    const jobResult = await triggerxService.createAutoTopUpJob(
      config.userAddress,
      'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev'
    );
    
    console.log('Automation job created successfully');
    console.log(`Monitoring: Health factor <= ${config.healthFactorThreshold}`);
    
  } catch (error: unknown) {
    console.error('Failed to create automation job:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }

  console.log('\nHealth monitoring system active');
  console.log('API: http://localhost:3000/health-factor/' + config.userAddress);
  console.log('Safe wallet: ' + triggerxService.getSafeAddress());
  console.log('\nKeep this process running (Ctrl+C to stop)');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
