import sequelize from "./config/database.js";
import KnowledgeSource from "./models/KnowledgeSource.js";

const fixUrls = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        const items = await KnowledgeSource.findAll();
        let count = 0;

        for (const item of items) {
            if (item.fileUrl && item.fileUrl.includes("localhost:9000")) {
                // Replace localhost:9000 with the actual public URL configured in .env
                const newUrl = item.fileUrl.replace("http://localhost:9000", "https://minio.dayamedialangit.co.id");
                item.fileUrl = newUrl;
                await item.save();
                count++;
            }
            if (item.fileUrl && !item.fileUrl.startsWith('http')) {
                // In case it's just missing the protocol
                const newUrl = item.fileUrl.startsWith('localhost') ?
                    item.fileUrl.replace("localhost", "http://localhost") :
                    item.fileUrl;
                item.fileUrl = newUrl;
                await item.save();
                count++;
            }
        }

        console.log(`Fixed ${count} Knowledge Resources URLs.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixUrls();
