import db from "./server/config/database.js";
import User from "./server/models/User.js";

async function run() {
  await db.authenticate();
  const users = await User.findAll({ where: { email: 'metareviewer@vlow.ai' }});
  console.log(users.map(u => ({ email: u.email, maxConversations: u.maxConversations, maxAiResponses: u.maxAiResponses })));
  process.exit(0);
}
run();
