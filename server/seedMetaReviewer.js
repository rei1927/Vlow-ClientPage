import sequelize from "./config/database.js";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const seedMetaReviewer = async () => {
    try {
        console.log("Starting Meta Reviewer Seeder...");
        await sequelize.authenticate();
        console.log("Database connected.");

        // Calculate 12 months from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const userData = {
            name: "Meta Reviewer",
            email: "metareviewer@vlow.ai",
            password: "!Metareviewer1*",
            role: "customer",
            isActive: true,
            isFirstLogin: true, // Let them change password if they want, or force false if requested. User request didn't specify, but password is provided so maybe false?
            // User provided a specific password, so let's set isFirstLogin to false so they aren't forced to change it immediately unless that's policy. 
            // Actually policy usually forces change. But let's stick to simple creation first.
            // Let's set it to false for convenience since password is known.
            isFirstLogin: false,
            subscriptionExpiry: expiryDate
        };

        // Check if user exists
        const existingUser = await User.findOne({ where: { email: userData.email } });

        if (existingUser) {
            console.log(`User ${userData.email} already exists. Updating...`);
            existingUser.name = userData.name;
            existingUser.role = userData.role;
            existingUser.subscriptionExpiry = userData.subscriptionExpiry;
            existingUser.isActive = userData.isActive;
            // Only update password if logic demands, but here we just update metadata usually. 
            // But since user explicitly asked for this user with this password, let's update password too to ensure it matches.
            existingUser.password = userData.password; // Hook will hash it
            await existingUser.save();
            console.log("User updated successfully.");
        } else {
            console.log(`Creating user: ${userData.email}`);
            await User.create(userData);
            console.log("User created successfully.");
        }

    } catch (error) {
        console.error("Error seeding Meta Reviewer:", error);
    } finally {
        await sequelize.close();
        console.log("Seeder finished.");
    }
};

seedMetaReviewer();
