// Script to check status of deployed TriggerX jobs
import { TriggerXClient, getJobsByUserAddress, getJobDataById } from 'sdk-triggerx';
import { config } from '../src/utils/config';
import { AaveService } from '../src/services/aave.service';

async function checkJobStatus() {
  console.log('TriggerX Job Status Checker');
  console.log('═'.repeat(70));
  console.log(`User Address: ${config.userAddress}`);
  console.log('═'.repeat(70));

  const client = new TriggerXClient(config.triggerxApiKey);
  const aaveService = new AaveService();

  try {
    // Get current health factor
    console.log('\n📊 Current Position Status:');
    const healthFactor = await aaveService.getHealthFactor(config.userAddress);
    const accountData = await aaveService.getUserAccountDetails(config.userAddress);
    
    console.log(`   Health Factor: ${healthFactor}`);
    console.log(`   Threshold: ${config.healthFactorThreshold}`);
    console.log(`   Total Collateral: ${accountData.totalCollateral} ETH`);
    console.log(`   Total Debt: ${accountData.totalDebt} ETH`);
    
    const shouldTrigger = healthFactor <= config.healthFactorThreshold;
    console.log(`   Condition Met: ${shouldTrigger ? '✅ YES (should trigger)' : '❌ NO'}`);

    // Fetch all jobs for this user
    console.log('\n🔍 Fetching your TriggerX jobs...');
    const response = await getJobsByUserAddress(client, config.userAddress);

    if (!response.success || !response.jobs) {
      console.log('\n❌ No jobs found for this address');
      if (response.error) {
        console.log(`Error: ${response.error}`);
      }
      console.log('\n💡 Deploy a job first using: npm run deploy-ngrok');
      return;
    }

    // Extract jobs from the response
    const jobs: any[] = [];
    const jobsData = response.jobs as any;
    
    // Handle different response structures
    if (jobsData.job_data) {
      jobs.push({ ...jobsData.job_data, type: 'general' });
    }
    if (jobsData.time_job_data) {
      if (Array.isArray(jobsData.time_job_data)) {
        jobs.push(...jobsData.time_job_data.map((j: any) => ({ ...j, type: 'time' })));
      } else {
        jobs.push({ ...jobsData.time_job_data, type: 'time' });
      }
    }
    if (jobsData.condition_job_data) {
      if (Array.isArray(jobsData.condition_job_data)) {
        jobs.push(...jobsData.condition_job_data.map((j: any) => ({ ...j, type: 'condition' })));
      } else {
        jobs.push({ ...jobsData.condition_job_data, type: 'condition' });
      }
    }
    if (jobsData.event_job_data) {
      if (Array.isArray(jobsData.event_job_data)) {
        jobs.push(...jobsData.event_job_data.map((j: any) => ({ ...j, type: 'event' })));
      } else {
        jobs.push({ ...jobsData.event_job_data, type: 'event' });
      }
    }

    if (jobs.length === 0) {
      console.log('\n❌ No jobs found for this address');
      console.log('\n💡 Deploy a job first using: npm run deploy-ngrok');
      return;
    }

    console.log(`\n✅ Found ${jobs.length} job(s)\n`);
    console.log('─'.repeat(70));

    // Display each job
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const jobNum = i + 1;

      console.log(`\n📋 JOB #${jobNum} (${job.type || 'unknown'} job)`);
      console.log('─'.repeat(70));
      
      // Basic Info
      console.log(`Job ID: ${job.job_id || 'N/A'}`);
      console.log(`Task Definition ID: ${job.task_definition_id || 'N/A'}`);
      console.log(`Created: ${job.created_at ? new Date(job.created_at).toLocaleString() : 'N/A'}`);
      
      // Status based on expiration and completion
      let status = '🟢 ACTIVE';
      if (job.is_completed) {
        status = '✅ COMPLETED';
      } else if (job.expiration_time && new Date(job.expiration_time) < new Date()) {
        status = '⏱️ EXPIRED';
      }
      console.log(`Status: ${status}`);
      
      // Type and Configuration
      console.log(`\nConfiguration:`);
      console.log(`   Recurring: ${job.recurring ? 'Yes' : 'No'}`);
      console.log(`   Timezone: ${job.timezone || 'N/A'}`);
      console.log(`   Chain ID: ${job.target_chain_id || 'N/A'}`);
      
      // Condition details (for condition-based jobs)
      if (job.type === 'condition' || job.condition_type) {
        console.log(`\nCondition Details:`);
        console.log(`   Type: ${job.condition_type || 'N/A'}`);
        console.log(`   Lower Limit: ${job.lower_limit}`);
        console.log(`   Upper Limit: ${job.upper_limit}`);
        console.log(`   Value Source Type: ${job.value_source_type || 'N/A'}`);
        console.log(`   Value Source URL: ${job.value_source_url || 'N/A'}`);
        
        // Check if condition is met
        if (shouldTrigger) {
          console.log(`   ✅ Condition is currently MET - should execute soon`);
        } else {
          console.log(`   ❌ Condition not met - waiting for HF ≤ ${job.lower_limit}`);
        }
      }
      
      // Target details
      if (job.target_contract_address) {
        console.log(`\nExecution Target:`);
        console.log(`   Contract: ${job.target_contract_address}`);
        console.log(`   Function: ${job.target_function || 'N/A'}`);
        console.log(`   Argument Type: ${job.arg_type === 0 ? 'Static' : job.arg_type === 1 ? 'Dynamic' : job.arg_type}`);
        
        if (job.arguments && job.arguments.length > 0) {
          console.log(`   Arguments: ${job.arguments.length} argument(s)`);
        }
        if (job.dynamic_arguments_script_url) {
          console.log(`   Dynamic Args URL: ${job.dynamic_arguments_script_url}`);
        }
      }
      
      // Timing info
      if (job.expiration_time) {
        const expirationTime = new Date(job.expiration_time).getTime();
        const now = Date.now();
        const remainingMs = expirationTime - now;
        const remainingSeconds = Math.floor(remainingMs / 1000);
        
        if (remainingSeconds > 0) {
          const remainingMinutes = Math.floor(remainingSeconds / 60);
          const remainingHours = Math.floor(remainingMinutes / 60);
          if (remainingHours > 0) {
            console.log(`\n⏱️  Expires: ${new Date(job.expiration_time).toLocaleString()}`);
            console.log(`   Time Remaining: ${remainingHours}h ${remainingMinutes % 60}m`);
          } else {
            console.log(`\n⏱️  Expires: ${new Date(job.expiration_time).toLocaleString()}`);
            console.log(`   Time Remaining: ${remainingMinutes} minutes`);
          }
        } else {
          console.log(`\n⏱️  Expiration: ⚠️ EXPIRED ${Math.abs(Math.floor(remainingSeconds / 60))} minutes ago`);
          console.log(`   Expired at: ${new Date(job.expiration_time).toLocaleString()}`);
        }
      }
      
      // Updated timestamp
      if (job.updated_at) {
        console.log(`Last Updated: ${new Date(job.updated_at).toLocaleString()}`);
      }
      
      console.log('─'.repeat(70));
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('═'.repeat(70));
    const activeJobs = jobs.filter((j: any) => !j.is_completed && (j.expiration_time ? new Date(j.expiration_time) > new Date() : true));
    console.log(`Active Jobs: ${activeJobs.length} / ${jobs.length}`);
    
    if (shouldTrigger && activeJobs.length > 0) {
      console.log('\n✅ You have active jobs and condition is met!');
      console.log('   TriggerX should execute the job within the next polling cycle.');
      console.log('   Monitor your position with: npm run verify-execution');
    } else if (shouldTrigger && activeJobs.length === 0) {
      console.log('\n⚠️  Condition is met but no active jobs found!');
      console.log('   Your jobs may have expired. Deploy a new job with: npm run deploy-ngrok');
    } else if (!shouldTrigger && activeJobs.length > 0) {
      console.log('\n⏳ Jobs are active but condition not met yet.');
      console.log(`   Waiting for health factor to drop to ${config.healthFactorThreshold} or below.`);
      console.log('   Lower your HF with: npm run manipulate-hf lower');
    } else {
      console.log('\n❌ No active jobs and condition not met.');
      console.log('   Deploy a job with: npm run deploy-ngrok');
    }

    console.log('\n💡 Pro Tips:');
    console.log('   • Jobs have a timeFrame - they expire after the specified duration');
    console.log('   • Increase timeFrame for longer monitoring (default: 3600s = 1 hour)');
    console.log('   • Set recurring: true to keep checking the condition');
    console.log('   • TriggerX polls conditions periodically, not in real-time');
    console.log('═'.repeat(70));

  } catch (error: any) {
    console.error('\n❌ Error checking job status:', error.message);
    
    if (error.message?.includes('404')) {
      console.log('\n💡 No jobs found. Deploy one with: npm run deploy-ngrok');
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
      console.log('\n💡 Check your TriggerX API key in .env file');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

checkJobStatus().catch(console.error);

