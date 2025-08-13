import serverless from "serverless-http";
import { createApp } from "./app.js";

// Export Lambda handler using serverless-http wrapping the Express app
const app = createApp();
export const handler = serverless(app, {
  // basePath: '/', // leave default; API Gateway HTTP API will proxy root
});
