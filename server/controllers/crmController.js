import CustomerProfile from "../models/CustomerProfile.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";

// @desc    Upsert Customer Profile (called by AI/Webhook)
// @route   POST /api/crm/profile
// @access  Public (should use API Key in production, but open for webhook testing)
export const upsertProfile = async (req, res, next) => {
    try {
        const { platformId, chatId, customName, requirements } = req.body;

        if (!platformId || !chatId) {
            return res.status(400).json({ success: false, message: "platformId dan chatId wajib diisi" });
        }

        const platform = await ConnectedPlatform.findByPk(platformId);
        if (!platform) {
            return res.status(404).json({ success: false, message: "Platform tidak ditemukan" });
        }

        // Find existing profile
        let profile = await CustomerProfile.findOne({
            where: { platformId, chatId }
        });

        if (profile) {
            // Update
            if (customName !== undefined) profile.customName = customName;
            if (requirements !== undefined) profile.requirements = requirements;
            await profile.save();
        } else {
            // Create new
            profile = await CustomerProfile.create({
                platformId,
                chatId,
                customName,
                requirements
            });
        }

        res.status(200).json({
            success: true,
            data: profile,
            message: "Customer profile berhasil diperbarui"
        });
    } catch (error) {
        console.error("Error upserting customer profile:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
