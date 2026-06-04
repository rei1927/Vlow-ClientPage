const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres', 'postgres.sbvfdotlmxmpdumdnnqw', 'Alamatgue123*', {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function main() {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`SELECT * FROM "PlatformLabels"`);
    console.log("Labels in DB:", results.length);
    if(results.length > 0) {
        console.log(results.slice(0, 5));
    }
}
main().catch(console.error).finally(() => process.exit(0));
