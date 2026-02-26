import sequelize from "./config/database.js";
import User from "./models/User.js";
import Agent from "./models/Agent.js";

const getInfo = async () => {
    try {
        await sequelize.authenticate();
        // user
        const u = await User.findOne({ where: { email: 'metareviewer@vlow.ai' } });
        console.log("SIMULATOR WEBHOOK DB:", u.n8nSimulatorWebhookUrl);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
getInfo();
