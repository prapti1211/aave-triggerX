import { TriggerXService } from '../src/services/triggerx.service';
import { config } from '../src/utils/config';

async function main() {
  console.log('Creating Safe Wallet...');
  
  const triggerxService = new TriggerXService();
  
  try {
    const safeAddress = await triggerxService.initializeSafeWallet();
    console.log('Safe Address:', safeAddress);
    console.log('Save this address to your .env file');
    
  } catch (error: unknown) {
    console.error('Failed to create Safe wallet:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

