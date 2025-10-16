import { TriggerXClient, createJob, JobType, ArgType } from 'sdk-triggerx';
import { ethers } from 'ethers';
import { config } from '../src/utils/config';
import { AAVE_POOL_ABI, WETH_ADDRESS } from '../src/contracts/abis';

async function deployNgrokJob() {
    console.log('🌐 Deploying TriggerX job with ngrok public URL...');

    // 🔥 FIXED - No leading/trailing spaces
    const ngrokUrl = 'https://unrecognized-conjunctionally-madelyn.ngrok-free.dev';

    console.log(`Using ngrok URL: ${ngrokUrl}`);

    const client = new TriggerXClient(config.triggerxApiKey);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);

    const jobInput = {
        jobType: JobType.Condition,
        argType: ArgType.Static,

        jobTitle: 'Auto Collateral Top-Up - Fixed URL',
        timeFrame: 300,
        recurring: false,
        timezone: 'UTC',

        chainId: config.chainId,
        conditionType: 'less_equal' as const,
        upperLimit: 10,
        lowerLimit: 1.2,
        valueSourceType: 'api' as const,
        // 🔥 CRITICAL - Clean URL with no spaces
        valueSourceUrl: `${ngrokUrl}/health-factor/${config.userAddress}`,

        targetContractAddress: config.aave.poolAddress,
        targetFunction: 'supply',
        abi: JSON.stringify(AAVE_POOL_ABI),

        arguments: [
            WETH_ADDRESS,
            ethers.parseEther('0.01').toString(),  // Convert 0.01 ETH to wei string
            config.userAddress,
            '0'                        // uint16 as number
        ],
        dynamicArgumentsScriptUrl: '',
        autotopupTG: true,
    };

    try {
        // 🔥 Add URL validation
        console.log('🔍 Validating URL...');
        console.log('Full API URL:', jobInput.valueSourceUrl);

        // Test the URL format
        try {
            new URL(jobInput.valueSourceUrl);
            console.log('✅ URL format is valid');
        } catch (urlError) {
            console.error('❌ Invalid URL format:', urlError);
            return;
        }

        const result = await createJob(client, { jobInput, signer });
        console.log('✅ Fixed ngrok job created successfully!');
        console.log('Job Result:', result);

        if (result.success && result.data?.job_ids) {
            console.log('- New Job ID:', result.data.job_ids[0]);
        }

    } catch (error) {
        console.error('❌ Error creating job:', error);
    }
}

deployNgrokJob().catch(console.error);
