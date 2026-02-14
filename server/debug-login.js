
import sequelize from "./config/database.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const debugLogin = async () => {
    try {
        console.log("--- Starting Debug ---");
        console.log("Environment PORT:", process.env.PORT);
        console.log("Environment JWT_SECRET:", process.env.JWT_SECRET ? "EXISTS" : "MISSING");

        await sequelize.authenticate();
        console.log("1. Database Connected.");

        const email = "admin@sapaku.ai";
        const password = "password123";

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.error("2. User NOT FOUND!");
            return;
        }
        console.log("2. User Found:", user.email);
        console.log("   User Hashed Password:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("3. Password Match Result:", isMatch);

        if (isMatch) {
            try {
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE || "1d",
                });
                console.log("4. Token Generated Successfully:", token.substring(0, 10) + "...");
            } catch (err) {
                console.error("4. Token Generation FAILED:", err.message);
            }
        } else {
            console.log("3. Password did not match.");
        }

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
    } finally {
        await sequelize.close();
        console.log("--- End Debug ---");
    }
};

debugLogin();
