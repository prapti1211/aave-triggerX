import { TriggerXClient, createJob, JobType, ArgType } from 'sdk-triggerx';
import { createSafeWallet } from 'sdk-triggerx/dist/api/safeWallet.js';
import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { AAVE_POOL_ABI, WETH_ADDRESS } from '../src/contracts/abis';

async function deployNgrokJob() {
    console.log('Deploying TriggerX job...');

    const ngrokUrl = (process.env.PUBLIC_URL || 'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev').trim();
    console.log('ngrok URL:', ngrokUrl);

    const client = new TriggerXClient(config.triggerxApiKey, {
        timeout: 90000 // 90 seconds for slow IPFS fetches
      });
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);

    try {
    if (!config.safeWalletAddress) {
            console.error('SAFE_WALLET_ADDRESS not found in .env');
            console.log('Add to .env: SAFE_WALLET_ADDRESS=0xYourAddress');
            process.exit(1);
        }

        console.log('Safe wallet:', config.safeWalletAddress);

        // Create job input with safeAddress
        const jobInput = {
            jobType: JobType.Condition,
            argType: ArgType.Static, // Use Static for fixed WETH amount
            jobTitle: 'Auto Supply to Aave',
            timeFrame: 300, // 1 hour (3600 seconds) - increase for longer monitoring
            recurring: false, // Changed to false for one-time job
            conditionType: 'less_equal' as const,
            upperLimit: 10,
            lowerLimit: config.healthFactorThreshold,
            valueSourceType: 'api' as const,
            valueSourceUrl: `${ngrokUrl}/health-factor/${config.userAddress}`,
            timezone: 'UTC',
            chainId: config.chainId,
            
            // Target contract and function
            targetContractAddress: config.aave.poolAddress,
            targetFunction: 'supply',
            abi: JSON.stringify([
                {
                    "inputs": [
                        { "internalType": "address", "name": "asset", "type": "address" },
                        { "internalType": "uint256", "name": "amount", "type": "uint256" },
                        { "internalType": "address", "name": "onBehalfOf", "type": "address" },
                        { "internalType": "uint16", "name": "referralCode", "type": "uint16" }
                    ],
                    "name": "supply",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]),
            
            // REQUIRED: Add Safe wallet configuration from env
            walletMode: 'safe' as const,
            safeAddress: config.safeWalletAddress,
            
            // For static Safe wallet jobs, use safeTransactions instead of arguments
            safeTransactions: [
                // TRANSACTION 1: Approve WETH for Aave Pool
                {
                    to: WETH_ADDRESS, // WETH contract address
                    value: '0',
                    data: new ethers.Interface([
                        {
                            "inputs": [
                                { "internalType": "address", "name": "spender", "type": "address" },
                                { "internalType": "uint256", "name": "amount", "type": "uint256" }
                            ],
                            "name": "approve",
                            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
                            "stateMutability": "nonpayable",
                            "type": "function"
                        }
                    ]).encodeFunctionData('approve', [
                        config.aave.poolAddress, // Aave Pool as spender
                        ethers.MaxUint256 // Approve maximum amount to avoid repeated approvals
                    ]),
                    operation: 0 // 0 = CALL
                },
                // TRANSACTION 2: Supply WETH to Aave Pool
                {
                    to: config.aave.poolAddress,
                    value: '0', // No ETH being sent
                    data: new ethers.Interface([
                        {
                            "inputs": [
                                { "internalType": "address", "name": "asset", "type": "address" },
                                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                                { "internalType": "address", "name": "onBehalfOf", "type": "address" },
                                { "internalType": "uint16", "name": "referralCode", "type": "uint16" }
                            ],
                            "name": "supply",
                            "outputs": [],
                            "stateMutability": "nonpayable",
                            "type": "function"
                        }
                    ]).encodeFunctionData('supply', [
                        WETH_ADDRESS, // WETH address on OP Sepolia
                        config.topUpAmount, // Amount to supply
                        config.userAddress, // On behalf of user
                        0 // Referral code
                    ]),
                    operation: 0 // 0 = CALL, 1 = DELEGATECALL
                }
            ],
            
            autotopupTG: true,
            language: 'go',
        };

        try {
            const net = await provider.getNetwork();
            console.log('Network:', Number(net.chainId));
        } catch (netErr: any) {
            console.error('RPC check failed:', netErr?.message);
        }

        try {
            new URL(jobInput.valueSourceUrl);
        } catch (urlError) {
            console.error('Invalid URL:', urlError);
            return;
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(jobInput.valueSourceUrl, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            console.log('API check:', res.status);
        } catch (probeErr: any) {
            console.error('API check failed:', probeErr?.message);
        }

        const result = await createJob(client, { jobInput, signer });
        
        if (result.success) {
            console.log('Job created successfully');
            if (result.data?.job_ids) {
                console.log('Job ID:', result.data.job_ids[0]);
            }
        } else {
            console.error('Job creation failed');
            console.error('Error:', (result as any).error);
        }

    } catch (error) {
        console.error('Error creating job:', error);
        if (error && typeof error === 'object') {
            const anyErr: any = error;
            if (anyErr.message) console.error(anyErr.message);
        }
    }
}

deployNgrokJob().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
