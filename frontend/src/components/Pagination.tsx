import type { SetURLSearchParams } from 'react-router-dom';

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  pages: (string | number)[];
  numberOfPages: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
}
import React from 'react';
import Button from './Button.tsx';
export default function Pagination({ page, pages, numberOfPages, searchParams, setSearchParams }: PaginationProps) {
  return (
    <div className={"flex justify-center gap-2 mt-4"}>
      <Button id="prevButton"
              children={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                             fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                             strokeWidth="2" className="feather feather-arrow-left icon size-6" viewBox="0 0 24 24">
                <path d="M19 12H5m7 7-7-7 7-7"></path>
              </svg>} size={'sm'} disabled={Number(page) === 1} onClick={() => {searchParams.set("page", (Number(page) - 1).toString()); setSearchParams({ page: (Number(page) - 1).toString() })}} />
      {pages.map((pageNumber: number | string) => (
        <Button id={"pageButton-" + pageNumber} children={pageNumber} key={pageNumber} size={'sm'} disabled={pageNumber === "..." || pageNumber == page} onClick={() => {if(typeof pageNumber == "string") return;searchParams.set("page", pageNumber.toString()); setSearchParams({ page: pageNumber.toString() })}} />
      ))}
      <Button id="nextButton"
              children={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                             fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                             strokeWidth="2" className="feather feather-arrow-right icon size-6" viewBox="0 0 24 24"
              >
                <path d="M5 12h14m-7-7 7 7-7 7"></path>
              </svg>} size={"sm"} disabled={Number(page) == Math.max(numberOfPages, 1)} onClick={() => {searchParams.set("page", (Number(page) + 1).toString()); setSearchParams({page: (Number(page) + 1).toString()})}}/>
    </div>
  );
}