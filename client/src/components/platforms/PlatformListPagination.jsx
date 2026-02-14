import ListPagination from "../common/ListPagination";

/**
 * Component untuk Pagination Platforms
 * Wrapper untuk ListPagination dengan label spesifik untuk Platforms
 */
const PlatformListPagination = ({
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
      itemLabel="platform"
    />
  );
};

export default PlatformListPagination;
