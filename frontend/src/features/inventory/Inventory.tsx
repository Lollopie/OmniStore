import { useState, useEffect, useRef } from 'react';
import {fetchInventory} from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddInventory.ts';
import InputField from '../../components/InputField.tsx';
import Button from '../../components/Button.tsx';
const InventoryManager = () => {
  // State for inventory items and form inputs
  const [inventory, setInventory] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);
  const [isMounted, setMounted] = useState(true);
  // Base API URL - replace with your actual API endpoint
// 1. Set your initial loading state to true right away
  useEffect(() => {
    // Use an abort controller to safely handle cleanup if the component unmounts
    if (isMounted) {
      fetchInventory(setMounted, setInventory, setError, setLoading );
    }
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal(); // Opens it as a true modal with a backdrop
    } else {
      dialog.close();
    }
  }, [isOpen, isMounted]); // Empty dependency array ensures this runs once on mount
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
        <Button children={"+"} variant={"add"} size={"md"} onClick={() => setIsOpen(true)} />
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
    </div>

  );
};

export default InventoryManager;