import sequelize from "./config/database.js";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log("Starting Admin Seeder...");
        await sequelize.authenticate();
        console.log("Database connected.");

        // Sync database to ensure tables exist
        console.log("Syncing database...");
        await sequelize.sync({ alter: true });

        const adminEmail = process.env.ADMIN_EMAIL || "admin@vlow.ai";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        const adminName = "Admin Vlow";

        // Check if admin exists
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log(`Admin user with email ${adminEmail} already exists.`);
            // Optional: Update password here if needed
            // existingAdmin.password = adminPassword; 
            // await existingAdmin.save();
        } else {
            console.log(`Creating admin user: ${adminEmail}`);
            await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword, // Password will be hashed by User model hook
                role: "admin",
                isActive: true,
                isFirstLogin: false // Skip first login change password for default admin
            });
            console.log("Admin user created successfully.");
        }

    } catch (error) {
        console.error("Error seeding admin:", error);
    } finally {
        await sequelize.close();
        console.log("Seeder finished.");
    }
};

seedAdmin();
