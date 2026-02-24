import { autoReleaseExpired } from "../controllers/handoverController.js";

const INTERVAL_MS = 60 * 1000; // Check every 1 minute

let schedulerInterval = null;

export const startHandoverScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }

    console.log("[HandoverScheduler] Started — checking every 60 seconds for expired handovers.");

    schedulerInterval = setInterval(async () => {
        const released = await autoReleaseExpired();
        if (released > 0) {
            console.log(`[HandoverScheduler] Auto-released ${released} handover(s).`);
        }
    }, INTERVAL_MS);
};

export const stopHandoverScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log("[HandoverScheduler] Stopped.");
    }
};
