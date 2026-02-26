import sequelize from "./config/database.js";
import KnowledgeSource from "./models/KnowledgeSource.js";

const viewItems = async () => {
    try {
        await sequelize.authenticate();
        const items = await KnowledgeSource.findAll();
        for (const item of items) {
            item.fileUrl = item.fileUrl.replace("https://minio.dayamedialangit.co.id/vlow-client", "http://localhost:9000/sapaku-agents");
            await item.save();
        }
        console.log("Updated URLs!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

viewItems();
