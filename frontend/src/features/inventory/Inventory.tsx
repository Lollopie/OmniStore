import { useState, useEffect, useRef } from 'react';
import {fetchInventory} from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddInventory.ts';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { generatePagination } from './hooks/generatePagination.ts';
import { useSearchParams } from 'react-router-dom';
import MainPage from '../../components/MainPage.tsx';
import AddButton from '../../components/AddButton.tsx';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
export interface InventoryItem {
  name: string;
  amount: string;
}
const InventoryManager = () => {
  // State for inventory items and form inputs
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
  const itemsPerPage = 10;
  // Base API URL - replace with your actual API endpoint
// 1. Set your initial loading state to true right away
  useEffect(() => {
    // Use an abort controller to safely handle cleanup if the component unmounts
    fetchInventory(Number(page), sort, setInventory, setTotalInventory, setError, setLoading );
  }, [page, sort]);
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
      <div className="flex flex-col overflow-hidden">
        <dialog
          ref={dialogRef} onClose={() => setIsOpen(false)} className="m-auto h-fit w-full max-w-md rounded-lg bg-white p-0 shadow-lg backdrop:backdrop-blur-xs backdrop:bg-black/10 justify-center">
          <div>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Add Item</h2>
              <Button children={<><span className="text-xl leading-none" aria-hidden="true">×</span><span
                className="sr-only">Close modal</span></>}
                      size={"sm"}
                      onClick={() => setIsOpen(false)}
                      className={"border-0"}
              />
            </header>
            <form onSubmit={(e) => {e.preventDefault();handleAddItem(name, amount, inventory, setName, setAmount, setInventory)}} className="flex flex-col">
              <div className="w-4/5 flex flex-col items-center justify-center mt-3">
                <InputField label={"Item Name"} type={"text"} value={name} onChange={setName} />
                <InputField label={"Amount"} type={"number"} value={amount} onChange={setAmount} />
              </div>
              <footer
                className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6"
              >
                <Button children={"Cancel"} variant={"danger"} size={"sm"} onClick={() => setIsOpen(false)} type={"button"} />
                <Button children={"Add"} variant={"add"} size={"sm"} type={"submit"} />
              </footer>
            </form>
          </div>
        </dialog>
      </div>
      <div className="w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Sort by:</label>
            <select className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" name="sort" id="sort" onChange={(e) => {setSort(e.target.value)}}>
              <option value="new">New</option>
              <option value="old">Old</option>
              <option value="name asc">Name Ascending</option>
              <option value="name desc">Name Descending</option>
              <option value="amount asc">Amount Ascending</option>
              <option value="amount desc">Amount Descending</option>
            </select>
            <AddButton onClick={() => setIsOpen(true)} />
          </div>
        </div>

        {/* Status Messages */}
        {loading && <p>Loading inventory...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {/* Inventory Table */}
        {!loading && !error && (
          <div className="mt-8 overflow-hidden border border-slate-100 rounded-lg">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
              <tr>
                <TableHead children="Name" variant="first" />
                <TableHead children="Amount" />
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
              {inventory.length === 0 ? (
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <TableDataCell colSpan={2} children="No items in inventory." className="text-center p-3 text-slate-600"/>
                </tr>
              ) : (
                inventory.map((item: InventoryItem, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <TableDataCell children={item.name} className="text-slate-900"/>
                    <TableDataCell children={item.amount} className="text-slate-900"/>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <footer>
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
            </svg>} size={"sm"} disabled={Number(page) == Math.max(Math.ceil(totalInventory / itemsPerPage), 1)} onClick={() => {searchParams.set("page", (Number(page) + 1).toString()); setSearchParams({page: (Number(page) + 1).toString()})}}/>
        </div>
      </footer>
    </MainPage>
  );
};

export default InventoryManager;