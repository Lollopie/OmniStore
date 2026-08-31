import { useState, useEffect, useRef } from 'react';
import { fetchInventory } from './hooks/fetchInventory'
import { handleAddItem } from './hooks/handleAddItem.ts';
import Button from '../../components/Button.tsx';
import { generatePagination } from '../../hooks/generatePagination.ts';
import { useSearchParams } from 'react-router';
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
  itemId: string;
  itemName: string;
  amount: string;
}
const InventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addItemIsOpen, setAddItemIsOpen] = useState(false);
  const [updateItemIsOpen, setUpdateItemIsOpen] = useState(false);
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
    <div className="max-w-2xl mx-auto">
      {addItemIsOpen && (
        <Modal dialogRef={addItemDialogRef} title="Add Item" onClose={() => setAddItemIsOpen(false)}>
          <ItemForm
            submitLabel="Add"
            onCancel={() => setAddItemIsOpen(false)}
            onSubmit={(data) => {
              handleAddItem({itemName: data.itemName, amount: data.amount.toString(), setRefreshIndex, addToast});
            setAddItemIsOpen(false);
          }}
        />
      </Modal>)}
      {updateItemIsOpen && (
        <Modal
        dialogRef={updateItemDialogRef}
        title="Update Item"
        onClose={() => {setUpdateItemIsOpen(false);setSelectedItem(null)}}
      >
        {selectedItem && (
          <ItemForm
            key={selectedItem.itemId}
            submitLabel="Update"
            onCancel={() => {setUpdateItemIsOpen(false);setSelectedItem(null)}}
            onSubmit={(data) => {
              handleUpdateItem({
                itemId: selectedItem.itemId,
                itemName: data.itemName,
                amount: data.amount.toString(),
                setRefreshIndex,
                addToast
              });
              setSelectedItem(null);
            }}
          />
        )}
      </Modal>)}
      <section className="bg-base-100 rounded-xl border border-base-300 p-4 sm:p-8 overflow-scroll">
        <div className="pb-6 mb-6 border-b border-base-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <fieldset className="fieldset sm:max-w-xs w-full">
            <legend className="fieldset-legend ml-1">Sort by:</legend>
            <select className="select select-sm focus:border-none focus:outline-none focus:ring-2 focus:ring-accent w-full"
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
          {(readStoredValue('activeRole') === 'admin' ||
            readStoredValue('activeRole') === 'manager') && (
              <AddButton onClick={() => setAddItemIsOpen(true)} className="btn-sm sm:btn-md" />
          )}
        </div>
        <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        {loading && <p>Loading inventory...</p>}
        {!loading && (
          <table className="mt-8 border border-base-300 rounded-lg table">
            <thead>
              <tr>
                <TableHead children="Name" variant="first" />
                <TableHead children="Amount" />
                {readStoredValue('activeRole') === 'admin' && <TableHead children="" />}
              </tr>
            </thead>
            <tbody>
            {inventory.length === 0 ? (
              <tr className="hover:bg-base-300/50 transition-colors">
                <TableDataCell colSpan={readStoredValue('activeRole') === 'admin' ? 3 : 2} children="No items in inventory." className="text-center p-3 text-base-300"/>
              </tr>
            ) : (
              inventory.map((item: InventoryItem) => (
                <tr key={item.itemId} className="hover:bg-base-300/50 transition-colors">
                  <TableDataCell children={item.itemName} />
                  <TableDataCell children={item.amount} />
                  {readStoredValue('activeRole') === 'admin' && (
                    <TableDataCell children={
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          onClick={() => {
                            setUpdateItemIsOpen(true);
                            setSelectedItem(item)
                          }}
                          children={<Edit size={16} className="stroke-current" />}
                          variant="info"
                          size="xs"
                        />
                      <Button
                        onClick={() => handleDeleteItem(
                          {
                            itemId: item.itemId,
                            itemName: item.itemName,
                            amount: item.amount.toString(),
                            setRefreshIndex,
                            addToast
                          }
                        )}
                        children={<Trash size={16}/>}
                        variant={"danger"}
                        size={"xs"}
                      />
                    </div>}
                   />
                  )}
                </tr>
              ))
            )}
            </tbody>
          </table>
        )}
      </section>
    <section className="mt-4">
      <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalInventory / itemsPerPage)} searchParams={searchParams} setSearchParams={setSearchParams} />
    </section>
    </div>
  );
};

export default InventoryManager;