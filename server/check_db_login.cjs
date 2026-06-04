const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize('postgres', 'postgres.sbvfdotlmxmpdumdnnqw', 'Alamatgue123*', {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'Users',
    timestamps: true
});

async function main() {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'reizarachmattullah@gmail.com' } });
    if (user) {
        console.log("User found! Password hash:", user.password);
        const isMatch = await bcrypt.compare('Alamatgue123', user.password);
        console.log("Match 'Alamatgue123':", isMatch);
        const isMatch2 = await bcrypt.compare('admin', user.password);
        console.log("Match 'admin':", isMatch2);
    } else {
        console.log("User not found!");
    }
}
main().catch(console.error).finally(() => process.exit(0));
