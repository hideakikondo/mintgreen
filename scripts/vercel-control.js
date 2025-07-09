import { VercelClient } from "@vercel/sdk";

async function main() {
    const action = process.argv[2]; // 'pause' or 'unpause'
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !vercelProjectId) {
        console.error(
            "VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables must be set.",
        );
        process.exit(1);
    }

    const client = new VercelClient({ token: vercelToken });

    try {
        if (action === "pause") {
            console.log(`Pausing Vercel project: ${vercelProjectId}...`);
            await client.projects.pause(vercelProjectId);
            console.log("Project paused successfully.");
        } else if (action === "unpause") {
            console.log(`Unpausing Vercel project: ${vercelProjectId}...`);
            await client.projects.unpause(vercelProjectId);
            console.log("Project unpaused successfully.");
        } else {
            console.error(
                'Invalid action. Please specify "pause" or "unpause".',
            );
            process.exit(1);
        }
    } catch (error) {
        console.error("Error controlling Vercel project:", error.message);
        process.exit(1);
    }
}

main();
