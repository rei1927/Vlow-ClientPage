import sequelize from "./config/database.js";
import Agent from "./models/Agent.js";

const getAgents = async () => {
    try {
        await sequelize.authenticate();
        const agents = await Agent.findAll({ raw: true });
        console.log("AGENTS:", agents.map(a => a.id));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
getAgents();
