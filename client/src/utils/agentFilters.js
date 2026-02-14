/**
 * Utility functions untuk filtering dan sorting agents
 */

/**
 * Filter agents berdasarkan search query
 * @param {Array} agents - Array of agents
 * @param {string} searchQuery - Search query
 * @returns {Array} - Filtered agents
 */
export const filterBySearch = (agents, searchQuery) => {
  if (!searchQuery || searchQuery.trim() === "") return agents;

  const query = searchQuery.toLowerCase().trim();
  return agents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query),
  );
};

/**
 * Filter agents berdasarkan status
 * @param {Array} agents - Array of agents
 * @param {string} statusFilter - Status filter ('all', 'active', 'inactive')
 * @returns {Array} - Filtered agents
 */
export const filterByStatus = (agents, statusFilter) => {
  if (statusFilter === "all") return agents;

  return agents.filter((agent) => {
    if (statusFilter === "active") return agent.isActive === true;
    if (statusFilter === "inactive") return agent.isActive === false;
    return true;
  });
};

/**
 * Sort agents berdasarkan criteria
 * @param {Array} agents - Array of agents
 * @param {string} sortBy - Sort criteria ('name', 'createdAt', 'updatedAt')
 * @param {string} sortOrder - Sort order ('asc', 'desc')
 * @returns {Array} - Sorted agents
 */
export const sortAgents = (agents, sortBy, sortOrder = "asc") => {
  const sorted = [...agents];

  sorted.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "name":
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt || 0);
        bValue = new Date(b.updatedAt || 0);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Apply all filters and sorting to agents
 * @param {Array} agents - Array of agents
 * @param {Object} filters - Filter options { searchQuery, statusFilter, sortBy, sortOrder }
 * @returns {Array} - Filtered and sorted agents
 */
export const applyFiltersAndSort = (agents, filters) => {
  let result = [...agents];

  // Apply search filter
  result = filterBySearch(result, filters.searchQuery);

  // Apply status filter
  result = filterByStatus(result, filters.statusFilter);

  // Apply sorting
  result = sortAgents(result, filters.sortBy, filters.sortOrder);

  return result;
};
