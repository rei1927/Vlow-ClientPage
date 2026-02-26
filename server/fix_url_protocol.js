import sequelize from "./config/database.js";
import KnowledgeSource from "./models/KnowledgeSource.js";

const fixUrls = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        const items = await KnowledgeSource.findAll();
        let count = 0;

        for (const item of items) {
           item.fileUrl = item.fileUrl.replace("http://localhost:9000/sapaku-agents", "https://minio.dayamedialangit.co.id/vlow-client");
           await item.save();
        }

        console.log(`Ensured external URLs for ${count} resources.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixUrls();
