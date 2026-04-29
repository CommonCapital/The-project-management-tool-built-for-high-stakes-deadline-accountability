import dotenv from "dotenv";
import path from "path";

// Load env from apps/web/.env.local
dotenv.config({ path: path.resolve(__dirname, "../../apps/web/.env.local") });

import { setupDeadlineEngine } from "./deadline-engine";
import { setupRecurringTasks } from "./recurring-tasks";
import { setupEmailDigest } from "./email-digest";

console.log("APEX Worker Initialized");

setupDeadlineEngine();
setupRecurringTasks();
setupEmailDigest();
