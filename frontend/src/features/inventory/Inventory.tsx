import { useState, useEffect, useRef } from 'react';
import {fetchInventory} from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddInventory.ts';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
import { generatePagination } from './hooks/generatePagination.ts';
import { useSearchParams } from 'react-router-dom';
const InventoryManager = () => {
  // State for inventory items and form inputs
  const [inventory, setInventory] = useState([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState([]);
  const [sort, setSort] = useState('new');
  const itemsPerPage = 10;
  // Base API URL - replace with your actual API endpoint
// 1. Set your initial loading state to true right away
  useEffect(() => {
    // Use an abort controller to safely handle cleanup if the component unmounts
    fetchInventory(Number(page), sort, setInventory, setTotalInventory, setError, setLoading );
  }, [page, sort]);
  useEffect(() => {
    generatePagination(Number(page), Math.ceil(totalInventory / itemsPerPage), setPages);
  }, [page, sort, totalInventory]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal(); // Opens it as a true modal with a backdrop
    } else {
      dialog.close();
    }
  }, [isOpen]);
  return (
    <div className={"flex flex-col items-center min-h-screen bg-gray-100 p-4"}>
      <div className="flex flex-col overflow-hidden">
        <dialog
          ref={dialogRef} onClose={() => setIsOpen(false)} className="m-auto h-fit w-full max-w-md rounded-lg bg-white p-0 shadow-lg backdrop:backdrop-blur-xs backdrop:bg-black/10 justify-center">
          <div>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Add Item</h2>
              <Button children={<><span className="text-xl leading-none" aria-hidden="true">×</span><span
                className="sr-only">Close modal</span></>}
                      variant={"default"}
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
                <Button children={"Add Item"} variant={"add"} size={"sm"} type={"submit"} />
              </footer>
            </form>
          </div>
        </dialog>
      </div>
      <div className="w-full max-w-100 m-1 font-sans flex flex-col">
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-800">Sort by:</label>
          <div className={"flex justify-between items-center mb-4"}>
            <select className="bg-slate-300 border rounded-md text-base h-10" name="sort" id="sort" onChange={(e) => {setSort(e.target.value)}}>
              <option value="new">New</option>
              <option value="old">Old</option>
              <option value="name asc">Name Ascending</option>
              <option value="name desc">Name Descending</option>
              <option value="amount asc">Amount Ascending</option>
              <option value="amount desc">Amount Descending</option>
            </select>
            <Button children={"+"} variant={"add"} size={"md"} onClick={() => setIsOpen(true)} />
          </div>
        </div>

        {/* Status Messages */}
        {loading && <p>Loading inventory...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {/* Inventory Table */}
        {!loading && !error && (
          <table className="w-full border-collapse mt-1">
            <thead>
            <tr className="border-b-2 border-b-slate-700">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Amount</th>
            </tr>
            </thead>
            <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center p-3 text-slate-600">
                  No items in inventory.
                </td>
              </tr>
            ) : (
              inventory.map((item, index) => (
                <tr key={item.id || index} className="border-b border-b-slate-200">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.amount}</td>
                </tr>
              ))
            )}
            </tbody>
          </table>
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
          {pages.map((pageNumber) => (
            <Button id={"pageButton-" + pageNumber} children={pageNumber} key={pageNumber} size={'sm'} disabled={pageNumber === "..." || pageNumber == page} onClick={() => {searchParams.set("page", pageNumber); setSearchParams({ page: pageNumber.toString() })}} />
          ))}
          <Button id="nextButton"
            children={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                           fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                           strokeWidth="2" className="feather feather-arrow-right icon size-6" viewBox="0 0 24 24"
            >
              <path d="M5 12h14m-7-7 7 7-7 7"></path>
            </svg>} size={"sm"} disabled={Number(page) == Math.ceil(totalInventory / itemsPerPage)} onClick={() => {searchParams.set("page", (Number(page) + 1).toString()); setSearchParams({page: (Number(page) + 1).toString()})}}/>
        </div>
      </footer>
    </div>
  );
};

export default InventoryManager;