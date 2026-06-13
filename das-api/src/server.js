import app from "./app.js";
import { env } from "./config/environment.js";
import { connectMongoDB } from "./config/mongodb.js";

async function startServer() {
  await connectMongoDB();
  app.listen(env.PORT);
}

try {
  await startServer();
} catch (_error) {
  process.exit(1);
}
