import sequelize from "./config/database.js";
import User from "./models/User.js";

const viewUser = async () => {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ raw: true });
        console.log(users.map(u => ({ email: u.email, simUrl: u.n8nSimulatorWebhookUrl })));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
viewUser();
