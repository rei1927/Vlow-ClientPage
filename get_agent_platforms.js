const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres.sbvfdotlmxmpdumdnnqw', 'Alamatgue123*', {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function main() {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`SELECT * FROM "ConnectedPlatforms"`);
    console.log("Platforms:", results);
}
main().catch(console.error).finally(() => process.exit(0));
