import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { prisma } from "./lib/db";

async function checkSync() {
    const lastSync = await prisma.syncLog.findFirst({
        orderBy: { syncedAt: "desc" },
    });
    console.log(JSON.stringify(lastSync));
}

checkSync().catch(console.error).finally(() => process.exit());
