interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  pages: (string | number)[];
  numberOfPages: number;
  onPageChange: (page: number) => void;
}
import React from 'react';
import Button from './Button.tsx';
export default function Pagination({ page, pages, numberOfPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex justify-center gap-2 join">
      <Button id="prevButton"
              children={"«"}
              className="text-lg join-item"
              size={'sm'}
              disabled={Number(page) === 1}
              onClick={() => onPageChange(Number(page) - 1)}
      />
      {pages.map((pageNumber: number | string) => (
        <input
          id={"pageButton-" + pageNumber}
          type="radio"
          name="options"
          aria-label={String(pageNumber)}
          className="join-item btn btn-square btn-sm"
          key={pageNumber}
          disabled={pageNumber === "..."}
          checked={pageNumber == page}
          onChange={() => {
            if(typeof pageNumber == "string")
              return;
            onPageChange(pageNumber);
          }}
        />
      ))}
      <Button
        id="nextButton"
        children={"»"}
        className="text-lg join-item"
        size={"sm"}
        disabled={Number(page) == Math.max(numberOfPages, 1)}
        onClick={() => onPageChange(Number(page) + 1)}
      />
    </div>
  );
}