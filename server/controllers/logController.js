import SystemLog from '../models/SystemLog.js';
import { Op } from 'sequelize';

// Get paginated system logs
export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, source, search } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    if (level) {
      where.level = level;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.message = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.status(200).json({
      success: true,
      data: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil log sistem', error: error.message });
  }
};

// Clear logs manually
export const clearLogs = async (req, res) => {
  try {
    await SystemLog.destroy({
      where: {},
      truncate: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Semua log berhasil dihapus.'
    });
  } catch (error) {
    console.error('Error clearing system logs:', error);
    res.status(500).json({ success: false, message: 'Gagal membersihkan log sistem', error: error.message });
  }
};
