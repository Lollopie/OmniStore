import { useState, useEffect, useRef } from 'react';
import {fetchInventory} from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddInventory.ts';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { generatePagination } from '../../hooks/generatePagination.ts';
import { useSearchParams } from 'react-router-dom';
import MainPage from '../../components/MainPage.tsx';
import AddButton from '../../components/AddButton.tsx';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
import Pagination from '../../components/Pagination.tsx';
import { useDebounce } from '../../hooks/useDebounce.ts';
import { SearchField } from '../../components/SearchField.tsx';
export interface InventoryItem {
  name: string;
  amount: string;
}
const InventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page: number = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState<(number | string)[]>([]);
  const [sort, setSort] = useState('new');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  useEffect(() => {
    const controller = new AbortController();
    fetchInventory({page: Number(page), sort, searchTerm: debouncedSearchTerm, controller, setInventory, setTotalInventory, setError, setLoading});
    return () => {
      controller.abort();
    };
  }, [page, sort, refreshIndex, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalInventory / itemsPerPage), 1), setPages);
  }, [page, sort, totalInventory]);
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    if (!dialog){
      return;
    }

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);
  return (
    <MainPage>
      <div className="max-w-2xl w-full overflow-hidden">
        <div className="flex flex-col">
          <dialog
            ref={dialogRef}
            onClose={() => setIsOpen(false)}
            className="modal"
          >
            <div className="modal-box">
              <header className="flex items-center justify-between sm:px-4">
                <h2 className="text-lg font-semibold text-base-400">Add Item</h2>
                <Button
                  size={"md"}
                  className="bg-base-100 text-base-300 border-none"
                  variant={"primary"}
                  onClick={() => setIsOpen(false)}
                  children={'X'}
                />
              </header>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddItem({name, amount, setName, setAmount, setRefreshIndex})
              }}
              className="flex flex-col"
              >
                <div className="w-full flex flex-col items-center justify-center mt-3 sm:px-4">
                  <InputField label={"Item Name"} type={"text"} value={name} onChange={setName} />
                  <InputField label={"Amount"} type={"number"} value={amount} onChange={setAmount} />
                </div>
                <footer className="w-full flex flex-col-reverse gap-3 px-4 py-4 mt-4 sm:flex-row sm:justify-end">
                  <Button children={"Cancel"} variant={"danger"} size={"sm"} onClick={() => setIsOpen(false)} type={"button"} />
                  <Button children={"Add"} variant={"add"} size={"sm"} type={"submit"} />
                </footer>
              </form>
            </div>
          </dialog>
        </div>
        <div className="w-full max-w-2xl mx-auto bg-base-100 rounded-xl shadow-sm border border-base-300 p-4 sm:p-8 overflow-scroll">
         <div className="space-y-6">
          <div className="w-full pb-6 border-b border-base-300">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row md:items-center md:gap-3">
                <fieldset className="flex-3 fieldset flex flex-row justify-left md:items-center gap-3">
                  <legend className="fieldset-legend ml-1">Sort by:</legend>
                  <select className="select select-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          name="sort"
                          id="sort"
                          onChange={(e) => {setSort(e.target.value)}}>
                    <option value="new">New</option>
                    <option value="old">Old</option>
                    <option value="name asc">Name Ascending</option>
                    <option value="name desc">Name Descending</option>
                    <option value="amount asc">Amount Ascending</option>
                    <option value="amount desc">Amount Descending</option>
                  </select>
                </fieldset>
                <div className="flex flex-1 pt-2 justify-center sm:justify-end sm:pt-0">
                  <AddButton onClick={() => setIsOpen(true)} />
                </div>
              </div>

            </div>
          </div>
          <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          {loading && <p>Loading inventory...</p>}
          {error && <p className="text-error">Error: {error}</p>}
        </div>
          {!loading && !error && (
            <div className="mt-8 overflow-hidden border border-base-300 rounded-lg">
              <table className="table min-w-full divide-y divide-base-300">
                <thead className="bg-base-100">
                <tr>
                  <TableHead children="Name" variant="first" />
                  <TableHead children="Amount" />
                </tr>
                </thead>
                <tbody className="divide-y divide-base-300 bg-base-100">
                {inventory.length === 0 ? (
                  <tr className="hover:bg-base-200/50 transition-colors">
                    <TableDataCell colSpan={2} children="No items in inventory." className="text-center p-3 text-base-300"/>
                  </tr>
                ) : (
                  inventory.map((item: InventoryItem, index) => (
                    <tr key={index} className="hover:bg-base-200/50 transition-colors">
                      <TableDataCell children={item.name} className="text-base-400"/>
                      <TableDataCell children={item.amount} className="text-base-400"/>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      <footer>
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalInventory / itemsPerPage)} searchParams={searchParams} setSearchParams={setSearchParams} />
      </footer>
      </div>
    </MainPage>
  );
};

export default InventoryManager;