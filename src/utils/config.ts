import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  privateKey: process.env.PRIVATE_KEY!,
  triggerxApiKey: process.env.TRIGGERX_API_KEY!,
  rpcUrl: process.env.SEPOLIA_RPC_URL!,
  chainId: process.env.CHAIN_ID!,
  userAddress: process.env.USER_ADDRESS!,
  
  aave: {
    poolAddress: process.env.AAVE_POOL_ADDRESS!,
    dataProvider: process.env.AAVE_POOL_DATA_PROVIDER!,
  },
  
  healthFactorThreshold: 1.2,
  topUpAmount: '10000000000000000', // 0.01 ETH in wei
  jobDuration: 300, // 5 minutes
};
