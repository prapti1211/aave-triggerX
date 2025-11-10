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
  console.log('\nTesting Aave connection...');
  const accountData = await aaveService.getUserAccountDetails(config.userAddress);
  console.log('Account Data:', accountData);

  // Wait for API to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 1: Initialize Safe Wallet
  console.log('\nInitializing Safe wallet...');
  try {
    const safeAddress = await triggerxService.initializeSafeWallet();
    console.log('[SUCCESS] Safe wallet created/initialized:', safeAddress);
    console.log('   This wallet will execute your automation jobs securely.');
  } catch (error: unknown) {
    console.error('[ERROR] Failed to initialize Safe wallet:', error);
    console.error('Cannot proceed without Safe wallet. Exiting...');
    process.exit(1);
  }

  // Step 2: Create TriggerX automation job
  console.log('\nCreating TriggerX automation job...');
  try {
    const jobResult = await triggerxService.createAutoTopUpJob(
      config.userAddress,
      'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev'
    );
    
    console.log('[SUCCESS] Auto top-up job created successfully!');
    
    // Handle different response formats
    if (jobResult.success && jobResult.data) {
      console.log('Job Result:', jobResult.data);
      
      // Try to extract job ID from various possible locations
      const jobId = jobResult.data.id || 
                    jobResult.data.jobId || 
                    jobResult.data.job_id ||
                    (Array.isArray(jobResult.data) && jobResult.data[0]?.id);
      
      if (jobId) {
        console.log('Job ID:', jobId);
      }
    } else {
      console.log('Job Result:', jobResult);
    }
    
    console.log('\nAutomation configured:');
    console.log(`   - Monitors health factor via API`);
    console.log(`   - Triggers when health factor ≤ ${config.healthFactorThreshold}`);
    console.log(`   - Tops up ${config.topUpAmount} collateral automatically`);
    console.log(`   - Executes via Safe wallet for security`);
    
  } catch (error: unknown) {
    console.error('[ERROR] Failed to create automation job:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }

  console.log('\nSystem is now running and monitoring your position!');
  console.log('Health factor API: http://localhost:3000/health-factor/' + config.userAddress);
  console.log('Safe wallet: ' + triggerxService.getSafeAddress());
  console.log('\n[WARNING] Keep this process running to maintain the health monitor API');
  console.log('   Press Ctrl+C to stop');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('[FATAL] Fatal error:', error);
  process.exit(1);
});
