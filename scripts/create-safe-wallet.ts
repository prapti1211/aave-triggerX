import { TriggerXService } from '../src/services/triggerx.service';
import { config } from '../src/utils/config';

async function main() {
  console.log('🔐 Creating Safe Wallet...');
  console.log(`Network: ${config.rpcUrl}`);
  
  // Initialize the triggerx service
  const triggerxService = new TriggerXService();
  
  try {
    // Create Safe wallet
    const safeAddress = await triggerxService.initializeSafeWallet();
    
    console.log('\n✅ Safe wallet created successfully!');
    console.log(`📍 Safe Address: ${safeAddress}`);
    console.log('\n💾 You can save this address and use it later when deploying the automation job.');
    console.log('   This Safe wallet will be used to execute your automation jobs securely.');
    
  } catch (error: unknown) {
    console.error('❌ Failed to create Safe wallet:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

