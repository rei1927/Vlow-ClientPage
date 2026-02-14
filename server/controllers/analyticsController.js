import { Op } from "sequelize";
import ConversationLog from "../models/ConversationLog.js";
import Agent from "../models/Agent.js";
import ConnectedPlatform from "../models/ConnectedPlatform.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

// @desc    Get Agent Analytics
// @route   GET /api/agents/:id/analytics
export const getAgentAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = "month" } = req.query; // month, week, day

    // 1. Verify agent belongs to user
    const agent = await Agent.findOne({
      where: { id, userId: req.user.id },
    });

    if (!agent) {
      return next(new AppError("Agent tidak ditemukan.", 404));
    }

    // 2. Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // 3. Get conversation logs
    const logs = await ConversationLog.findAll({
      where: {
        agentId: id,
        mode: "production", // Hanya production, exclude simulator
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // 4. Calculate metrics
    const totalConversations = logs.length;

    // Unique chats (based on chatId)
    const uniqueChats = new Set(logs.map((log) => log.chatId)).size;

    // Handoff rate
    const handoffCount = logs.filter((log) => log.isHandoff === true).length;
    const handoverRate = totalConversations > 0 ? (handoffCount / totalConversations) * 100 : 0;

    // Sentiment score (positive percentage)
    const sentimentLogs = logs.filter((log) => log.sentiment !== null);
    const positiveCount = sentimentLogs.filter((log) => log.sentiment === "positive").length;
    const sentimentScore =
      sentimentLogs.length > 0 ? (positiveCount / sentimentLogs.length) * 100 : 0;

    // 5. Get recent conversations (last 10)
    const recentConversations = logs.slice(0, 10).map((log) => ({
      id: log.id,
      chatId: log.chatId,
      userMessage: log.userMessage?.substring(0, 50) + (log.userMessage?.length > 50 ? "..." : ""),
      aiResponse: log.aiResponse?.substring(0, 50) + (log.aiResponse?.length > 50 ? "..." : ""),
      isHandoff: log.isHandoff,
      sentiment: log.sentiment,
      createdAt: log.createdAt,
    }));

    // 6. Get daily stats for chart (last 7 days)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = logs.filter(
        (log) => log.createdAt >= date && log.createdAt < nextDate,
      );
      dailyStats.push({
        date: date.toISOString().split("T")[0],
        count: dayLogs.length,
        handoffs: dayLogs.filter((log) => log.isHandoff).length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalConversations,
        uniqueChats,
        handoverRate: Math.round(handoverRate * 100) / 100,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        recentConversations,
        dailyStats,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log Conversation (Called from n8n webhook)
// @route   POST /api/analytics/log
export const logConversation = async (req, res, next) => {
  try {
    const {
      agentId,
      platformId,
      sessionId,
      chatId,
      userMessage,
      aiResponse,
      isHandoff,
      sentiment,
      mode = "production",
      metadata,
    } = req.body;

    if (!agentId || !sessionId || !chatId) {
      return res.status(400).json({ message: "agentId, sessionId, dan chatId wajib diisi" });
    }

    // Verify agent exists
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent tidak ditemukan" });
    }

    const log = await ConversationLog.create({
      agentId,
      platformId: platformId || null,
      sessionId,
      chatId,
      userMessage: userMessage || null,
      aiResponse: aiResponse || null,
      isHandoff: isHandoff === true || isHandoff === "true",
      sentiment: sentiment || null,
      mode: mode === "simulation" ? "simulation" : "production",
      metadata: metadata || null,
    });

    res.status(201).json({
      success: true,
      message: "Conversation logged",
      data: log,
    });
  } catch (error) {
    console.error("Log Conversation Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Get Dashboard Stats (Customer Dashboard)
// @route   GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Get Total Agents
    const totalAgents = await Agent.count({
      where: { userId },
    });

    // 2. Get Messages Today (production mode only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all agent IDs for this user
    const userAgents = await Agent.findAll({
      where: { userId },
      attributes: ["id"],
    });
    const agentIds = userAgents.map((agent) => agent.id);

    const messagesToday = await ConversationLog.count({
      where: {
        agentId: { [Op.in]: agentIds },
        mode: "production",
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // 3. Get Platform Status (check if any platform is WORKING)
    const platforms = await ConnectedPlatform.findAll({
      where: { userId },
      attributes: ["id", "name", "status", "provider"],
    });

    const hasWorkingPlatform = platforms.some((p) => p.status === "WORKING");
    const platformStatus = hasWorkingPlatform ? "Connected" : "Not Connected";
    const totalPlatforms = platforms.length;
    const connectedPlatforms = platforms.filter((p) => p.status === "WORKING").length;

    // 4. Get Conversation Statistics (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so 6 days ago

    const conversationLogs = await ConversationLog.findAll({
      where: {
        agentId: { [Op.in]: agentIds },
        mode: "production",
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      order: [["createdAt", "ASC"]],
    });

    // Group by day
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = conversationLogs.filter(
        (log) => log.createdAt >= date && log.createdAt < nextDate,
      );

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        count: dayLogs.length,
        handoffs: dayLogs.filter((log) => log.isHandoff).length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalAgents,
        messagesToday,
        platformStatus,
        totalPlatforms,
        connectedPlatforms,
        hasWorkingPlatform,
        dailyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/analytics/admin-dashboard
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // Only admin can access this endpoint
    if (req.user.role !== "admin") {
      return next(new AppError("Akses ditolak. Hanya admin yang dapat mengakses endpoint ini.", 403));
    }

    const now = new Date();

    // 1. Total Customers (users with role 'customer')
    const totalCustomers = await User.count({
      where: {
        role: "customer",
      },
    });

    // 2. Active Subscriptions (customers with valid subscription)
    const activeSubscriptions = await User.count({
      where: {
        role: "customer",
        subscriptionExpiry: {
          [Op.gte]: now, // Subscription belum expired
        },
      },
    });

    // 3. New Customers This Week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const newCustomersThisWeek = await User.count({
      where: {
        role: "customer",
        createdAt: {
          [Op.gte]: oneWeekAgo,
        },
      },
    });

    // 4. Calculate Active Subscription Percentage
    const activeSubscriptionPercentage =
      totalCustomers > 0 ? Math.round((activeSubscriptions / totalCustomers) * 100) : 0;

    // 5. Total Agents (all agents created by all customers)
    const totalAgents = await Agent.count();

    // 6. Total Messages Today (all customers)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalMessagesToday = await ConversationLog.count({
      where: {
        mode: "production",
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // 7. Recent Customers (last 5)
    const recentCustomers = await User.findAll({
      where: {
        role: "customer",
      },
      attributes: ["id", "name", "email", "isActive", "subscriptionExpiry", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Format recent customers
    const formattedRecentCustomers = recentCustomers.map((user) => {
      const isSubscriptionActive =
        user.subscriptionExpiry && new Date(user.subscriptionExpiry) >= now;
      const status = user.isActive
        ? isSubscriptionActive
          ? "Active"
          : "Expired"
        : "Inactive";

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        status,
        createdAt: user.createdAt,
      };
    });

    // 8. Daily Statistics for Chart (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so 6 days ago

    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Messages per day
      const messagesCount = await ConversationLog.count({
        where: {
          mode: "production",
          createdAt: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      // New customers per day
      const newCustomersCount = await User.count({
        where: {
          role: "customer",
          createdAt: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      // New agents per day
      const newAgentsCount = await Agent.count({
        where: {
          createdAt: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        messages: messagesCount,
        newCustomers: newCustomersCount,
        newAgents: newAgentsCount,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeSubscriptions,
        newCustomersThisWeek,
        activeSubscriptionPercentage,
        totalAgents,
        totalMessagesToday,
        recentCustomers: formattedRecentCustomers,
        dailyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
