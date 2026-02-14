import ListPagination from "../common/ListPagination";

/**
 * Component untuk Pagination Agents
 * Wrapper untuk ListPagination dengan label spesifik untuk Agents
 */
const AgentListPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}) => {
  return (
    <ListPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      isLoading={isLoading}
      itemLabel="agent"
    />
  );
};

export default AgentListPagination;
