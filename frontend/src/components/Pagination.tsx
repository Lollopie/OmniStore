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
    <div className={"flex justify-center gap-2 mt-4 join"}>
      <Button id="prevButton"
              children={"«"} className="text-lg join-item" size={'sm'} disabled={Number(page) === 1} onClick={() => {searchParams.set("page", (Number(page) - 1).toString()); setSearchParams({ page: (Number(page) - 1).toString() })}} />
      {pages.map((pageNumber: number | string) => (
        <input id={"pageButton-" + pageNumber} type="radio" name="options" aria-label={String(pageNumber)} className="join-item btn btn-square btn-sm" key={pageNumber} disabled={pageNumber === "..."} checked={pageNumber == page} onClick={() => {if(typeof pageNumber == "string") return;searchParams.set("page", pageNumber.toString()); setSearchParams({ page: pageNumber.toString() })}} />
      ))}
      <Button id="nextButton"
              children={"»"} className="text-lg join-item" size={"sm"} disabled={Number(page) == Math.max(numberOfPages, 1)} onClick={() => {searchParams.set("page", (Number(page) + 1).toString()); setSearchParams({page: (Number(page) + 1).toString()})}}/>
    </div>
  );
}