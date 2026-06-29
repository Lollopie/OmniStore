export function generatePagination(currentPage: number, totalPages: number, setPages) {
  const SIBLINGS = 1; // How many numbers to show on either side of current page

  // If total pages is small, just return a range from 1 to totalPages
  if (totalPages <= 7) {
    setPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    return;
  }

  const leftSiblingIndex = Math.max(currentPage - SIBLINGS, 1);
  const rightSiblingIndex = Math.min(currentPage + SIBLINGS, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  // Case 2: Near the beginning, hide left ellipsis
  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * SIBLINGS; // 5 items
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    setPages([...leftRange, '...', totalPages]);
    return;
  }

  // Case 4: Near the end, hide right ellipsis
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * SIBLINGS;
    const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
    setPages([1, '...', ...rightRange]);
    return;
  }

  // Case 3: Middle, show both ellipses
  if (showLeftEllipsis && showRightEllipsis) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    setPages([1, '...', ...middleRange, '...', totalPages]);
    return;
  }
}