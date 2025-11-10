import { TriggerXService } from '../src/services/triggerx.service';
import { HealthMonitorService } from '../src/services/health-monitor.service';
import { AaveService } from '../src/services/aave.service';
import { config } from '../src/utils/config';

async function main() {
  console.log('Starting Aave TriggerX Auto Top-Up System');
  console.log(`Monitoring address: ${config.userAddress}`);
  console.log(`Health factor threshold: ${config.healthFactorThreshold}`);

  // Initialize services
  const aaveService = new AaveService();
  const healthMonitor = new HealthMonitorService();

  // Start health monitoring API
  healthMonitor.start(3000);

  // Test Aave connection
  console.log('\nTesting Aave connection...');
  const accountData = await aaveService.getUserAccountDetails(config.userAddress);
  console.log('Account Data:', accountData);

  console.log('\nSystem is now running and monitoring your position!');
  console.log('Health factor API: http://localhost:3000/health-factor/' + config.userAddress);
  console.log('\nNext steps:');
  console.log('1. Run ngrok in another terminal: ngrok http 3000');
  console.log('2. Copy the ngrok URL and update scripts/deploy-ngrok-job.ts');
  console.log('3. Run: npm run deploy-ngrok');
}

main().catch(console.error);
