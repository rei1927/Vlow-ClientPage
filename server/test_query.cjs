const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgresql://vlow:vlow_secret@vlow_postgres:5432/vlow_db');
sequelize.query('SELECT id, "sessionId", "platformId", "chatId", "userMessage" FROM "ConversationLogs" ORDER BY "createdAt" DESC LIMIT 5;')
  .then(([results]) => { console.log(results); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
