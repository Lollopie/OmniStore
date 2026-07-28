import { useState, useEffect, useRef } from 'react';
import { fetchInventory } from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddItem.ts';
import Button from '../../components/Button.tsx';
import { generatePagination } from '../../hooks/generatePagination.ts';
import { useSearchParams } from 'react-router';
import MainPage from '../../components/MainPage.tsx';
import AddButton from '../../components/AddButton.tsx';
import TableHead from '../../components/TableHead.tsx';
import TableDataCell from '../../components/TableDataCell.tsx';
import Pagination from '../../components/Pagination.tsx';
import { useDebounce } from '../../hooks/useDebounce.ts';
import { SearchField } from '../../components/SearchField.tsx';
import { useToast } from '../toast';
import Edit from '../../assets/Edit.tsx';
import Trash from '../../assets/Trash.tsx';
import { Modal } from '../../components/Modal.tsx';
import { ItemForm } from './components/ItemForm.tsx';
import { handleUpdateItem } from './hooks/handleUpdateItem.ts';
import { handleDeleteItem } from './hooks/handleDeleteItem.ts';
import { readStoredValue } from '../../hooks/readStoredValue.ts';
export interface InventoryItem {
  id: string;
  itemName: string;
  amount: string;
}
const InventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addItemIsOpen, setAddItemIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const addItemDialogRef = useRef<HTMLDialogElement>(null);
  const updateItemDialogRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page: number = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState<(number | string)[]>([]);
  const [sort, setSort] = useState('new');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { addToast } = useToast();
  useEffect(() => {
    const controller = new AbortController();
    fetchInventory({page: Number(page), sort, searchTerm: debouncedSearchTerm, controller, setInventory, setTotalInventory, setLoading, addToast});
    return () => {
      controller.abort();
    };
  }, [page, sort, refreshIndex, debouncedSearchTerm]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalInventory / itemsPerPage), 1), setPages);
  }, [page, sort, totalInventory]);
  useEffect(() => {
    const dialog: HTMLDialogElement | null = addItemDialogRef.current;
    if (!dialog){
      return;
    }

    if (addItemIsOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [addItemIsOpen]);
  useEffect(() => {
    const dialog: HTMLDialogElement | null = updateItemDialogRef.current;
    if (!dialog){
      return;
    }

    if (selectedItem) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [selectedItem]);
  return (
    <MainPage>
      <div className="max-w-2xl w-full overflow-hidden">
        <Modal dialogRef={addItemDialogRef} title="Add Item" onClose={() => setAddItemIsOpen(false)}>
          <ItemForm
            submitLabel="Add"
            onCancel={() => setAddItemIsOpen(false)}
            onSubmit={(data) => {
              handleAddItem({itemName: data.itemName, amount: data.amount.toString(), setRefreshIndex, addToast});
              setAddItemIsOpen(false);
            }}
          />
        </Modal>
        <Modal
          dialogRef={updateItemDialogRef}
          title="Update Item"
          onClose={() => setSelectedItem(null)}
        >
          {selectedItem && (
            <ItemForm
              key={selectedItem.id}
              submitLabel="Update"
              onCancel={() => setSelectedItem(null)}
              onSubmit={(data) => {
                handleUpdateItem({
                  id: selectedItem.id,
                  itemName: data.itemName,
                  amount: data.amount.toString(),
                  setRefreshIndex,
                  addToast
                });
                setSelectedItem(null);
              }}
            />
          )}
        </Modal>
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
                    <option value="itemName asc">Name Ascending</option>
                    <option value="itemName desc">Name Descending</option>
                    <option value="amount asc">Amount Ascending</option>
                    <option value="amount desc">Amount Descending</option>
                  </select>
                </fieldset>
                <div className="flex flex-1 pt-2 justify-center sm:justify-end sm:pt-0">
                  <AddButton onClick={() => setAddItemIsOpen(true)} />
                </div>
              </div>

            </div>
          </div>
          <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          {loading && <p>Loading inventory...</p>}
        </div>
          {!loading && (
            <div className="mt-8 overflow-hidden border border-base-300 rounded-lg">
              <table className="table min-w-full divide-y divide-base-300">
                <thead className="bg-base-100">
                <tr>
                  <TableHead children="Name" variant="first" />
                  <TableHead children="Amount" />
                  {readStoredValue('activeRole') === 'admin' && <TableHead children="" />}
                </tr>
                </thead>
                <tbody className="divide-y divide-base-300 bg-base-100">
                {inventory.length === 0 ? (
                  <tr className="hover:bg-base-300/50 transition-colors">
                    <TableDataCell colSpan={readStoredValue('activeRole') === 'admin' ? 3 : 2} children="No items in inventory." className="text-center p-3 text-base-300"/>
                  </tr>
                ) : (
                  inventory.map((item: InventoryItem) => (
                    <tr key={item.id} className="hover:bg-base-300/50 transition-colors">
                      <TableDataCell children={item.itemName} className="text-base-400"/>
                      <TableDataCell children={item.amount} className="text-base-400"/>
                      {readStoredValue('activeRole') === 'admin' && (
                        <TableDataCell children={
                          <div className="flex justify-end items-center gap-2">
                            <Button onClick={() => setSelectedItem(item)}
                                    children={<Edit size={16} className="stroke-current" />}
                                    variant={"info"}
                                  size={"xs"} />
                          <Button onClick={() => handleDeleteItem({id: item.id, itemName: item.itemName, amount: item.amount.toString(), setRefreshIndex, addToast})}
                                  children={<Trash size={16}/>}
                                  variant={"danger"}
                                  size={"xs"} />
                        </div>}
                                     className="text-base-400"/>
                      )}
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