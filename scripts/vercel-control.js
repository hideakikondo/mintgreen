import { Vercel } from '@vercel/sdk';

async function main() {
  const action = process.argv[2]; // 'pause' or 'unpause'
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  if (!vercelToken || !vercelProjectId) {
    console.error('VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables must be set.');
    process.exit(1);
  }

  const vercel = new Vercel({ bearerToken: vercelToken });

  try {
    if (action === 'pause') {
      console.log(`Pausing Vercel project: ${vercelProjectId}...`);
      await vercel.projects.pauseProject({ projectId: vercelProjectId });
      console.log('Project paused successfully.');
    } else if (action === 'unpause') {
      console.log(`Unpausing Vercel project: ${vercelProjectId}...`);
      await vercel.projects.unpauseProject({ projectId: vercelProjectId });
      console.log('Project unpaused successfully.');
    } else {
      console.error('Invalid action. Please specify "pause" or "unpause".');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error controlling Vercel project:', error.message);
    if (error.response) {
      console.error('Vercel API Error Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();