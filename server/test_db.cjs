const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres.sbvfdotlmxmpdumdnnqw:Alamatgue123*@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require');
async function run() {
  const [results] = await sequelize.query("SELECT * FROM \"ConnectedPlatforms\" WHERE provider='meta_cloud'");
  console.log("Platforms:", results.map(p => p.id));
  if(results[0]) {
    const [msgs] = await sequelize.query(`SELECT "chatId", "contactName" FROM "MetaMessages" WHERE "platformId"='${results[0].id}' LIMIT 5`);
    console.log("MetaMessages:", msgs);
  }
}
run().catch(console.error);
