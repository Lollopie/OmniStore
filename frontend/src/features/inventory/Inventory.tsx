import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
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
import { readStoredValue } from '../../hooks/readStoredValue.ts';
import { useSubscription } from '../payment/subscriptionContext';
import { apiInventorySource } from './data/apiInventorySource.ts';
import {
  inventorySortOptions,
  type InventoryItem,
  type InventorySort,
  type InventorySource,
} from './data/inventorySource.ts';

export type { InventoryItem } from './data/inventorySource.ts';

interface InventoryManagerProps {
  // Defaults to the backend API; the homepage passes an in-memory demo source
  source?: InventorySource;
  // Defaults to the active role in local storage
  role?: string;
  // Defaults to the subscription's read-only state
  readOnly?: boolean;
  // Keeps the current page in the ?page= query parameter, so it survives reloads
  pageInUrl?: boolean;
  className?: string;
}

const InventoryManager = ({
                            source = apiInventorySource,
                            role,
                            readOnly,
                            pageInUrl = true,
                            className = '',
                          }: InventoryManagerProps) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addItemIsOpen, setAddItemIsOpen] = useState(false);
  const [updateItemIsOpen, setUpdateItemIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const addItemDialogRef = useRef<HTMLDialogElement>(null);
  const updateItemDialogRef = useRef<HTMLDialogElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [localPage, setLocalPage] = useState(1);
  const page: number = pageInUrl ? Number(searchParams.get('page')) || 1 : localPage;
  const setPage = (nextPage: number) => {
    if (pageInUrl) {
      setSearchParams({ page: nextPage.toString() });
    } else {
      setLocalPage(nextPage);
    }
  };
  const [pages, setPages] = useState<(number | string)[]>([]);
  const [sort, setSort] = useState<InventorySort>('new');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const itemsPerPage = source.pageSize;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { addToast } = useToast();
  const subscription = useSubscription();
  const isReadOnly = readOnly ?? subscription.isReadOnly;
  const activeRole = role ?? readStoredValue('activeRole');
  const canAdd = activeRole === 'admin' || activeRole === 'manager';
  const canEdit = activeRole === 'admin';
  // A new search or sort starts from the first page, which otherwise could be past the last result
  const resetPage = () => {
    if (page !== 1) {
      setPage(1);
    }
  };
  const updateSearchTerm: Dispatch<SetStateAction<string>> = (value) => {
    setSearchTerm(value);
    resetPage();
  };

  const mutate = async (action: () => Promise<void>, successMessage: string, errorMessage: string) => {
    try {
      await action();
      setRefreshIndex(prev => prev + 1);
      addToast(successMessage, 'success', 3000);
    } catch (err) {
      addToast(errorMessage, 'error', 3000);
      if (err instanceof Error) {
        console.error(`${errorMessage}: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    source.list({ page, sort, searchTerm: debouncedSearchTerm }, controller.signal)
      .then(([items, total]) => {
        setInventory(items);
        setTotalInventory(total);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        addToast('Failed to fetch inventory.', 'error', 3000);
        if (err instanceof Error) {
          console.error(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => {
      controller.abort();
    };
  }, [source, page, sort, refreshIndex, debouncedSearchTerm, addToast]);
  useEffect(() => {
    generatePagination(Number(page), Math.max(Math.ceil(totalInventory / itemsPerPage), 1), setPages);
  }, [page, sort, totalInventory, itemsPerPage]);
  useEffect(() => {
    const dialog: HTMLDialogElement | null = addItemDialogRef.current;
    if (!dialog) {
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
    if (!dialog) {
      return;
    }

    if (selectedItem) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [selectedItem]);
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {addItemIsOpen && (
        <Modal dialogRef={addItemDialogRef} title="Add Item" onClose={() => setAddItemIsOpen(false)}>
          <ItemForm
            submitLabel="Add"
            onCancel={() => setAddItemIsOpen(false)}
            onSubmit={(data) => {
              mutate(
                () => source.add({ itemName: data.itemName.trim(), amount: data.amount.toString() }),
                'Item added successfully!',
                'Failed to add item',
              );
              setAddItemIsOpen(false);
            }}
          />
        </Modal>)}
      {updateItemIsOpen && (
        <Modal
          dialogRef={updateItemDialogRef}
          title="Update Item"
          onClose={() => {
            setUpdateItemIsOpen(false);
            setSelectedItem(null);
          }}
        >
          {selectedItem && (
            <ItemForm
              key={selectedItem.itemId}
              submitLabel="Update"
              onCancel={() => {
                setUpdateItemIsOpen(false);
                setSelectedItem(null);
              }}
              onSubmit={(data) => {
                mutate(
                  () => source.update({
                    itemId: selectedItem.itemId,
                    itemName: data.itemName.trim(),
                    amount: data.amount.toString(),
                  }),
                  'Item updated successfully!',
                  'Failed to update item',
                );
                setSelectedItem(null);
              }}
            />
          )}
        </Modal>)}
      <section className="bg-base-100 rounded-xl border border-base-300 p-4 sm:p-8 overflow-scroll">
        <div
          className="pb-6 mb-6 border-b border-base-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <fieldset className="fieldset sm:max-w-xs w-full">
            <legend className="fieldset-legend ml-1">Sort by:</legend>
            <select
              className="select select-sm focus:border-none focus:outline-none focus:ring-2 focus:ring-accent w-full"
              name="sort"
              id="sort"
              onChange={(e) => {
                setSort(e.target.value as InventorySort);
                resetPage();
              }}>
              {inventorySortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </fieldset>
          {canAdd && (
            <AddButton onClick={() => setAddItemIsOpen(true)} disabled={isReadOnly} className="btn-sm sm:btn-md" />
          )}
        </div>
        <SearchField className="sm:max-w-xs w-full" searchTerm={searchTerm} setSearchTerm={updateSearchTerm} />
        {loading && <p>Loading inventory...</p>}
        {!loading && (
          <table className="mt-8 border border-base-300 rounded-lg table">
            <thead>
            <tr>
              <TableHead children="Name" variant="first" />
              <TableHead children="Amount" />
              {canEdit && <TableHead children="" />}
            </tr>
            </thead>
            <tbody>
            {inventory.length === 0 ? (
              <tr className="hover:bg-base-300/50 transition-colors">
                <TableDataCell colSpan={canEdit ? 3 : 2}
                               children="No items in inventory." className="text-center p-3 text-base-300" />
              </tr>
            ) : (
              inventory.map((item: InventoryItem) => (
                <tr key={item.itemId} className="hover:bg-base-300/50 transition-colors">
                  <TableDataCell children={item.itemName} />
                  <TableDataCell children={item.amount} />
                  {canEdit && (
                    <TableDataCell children={
                                     <div className="flex justify-end items-center gap-2">
                                       <Button
                                         onClick={() => {
                                           setUpdateItemIsOpen(true);
                                           setSelectedItem(item);
                                         }}
                                         children={<Edit size={16} className="stroke-current" />}
                                         variant="info"
                                         size="xs"
                                         disabled={isReadOnly}
                                       />
                                       <Button
                                         onClick={() => mutate(
                                           () => source.remove(item),
                                           'Item deleted successfully!',
                                           'Failed to delete item',
                                         )}
                                         children={<Trash size={16} />}
                                         variant={'danger'}
                                         size={'xs'}
                                         disabled={isReadOnly}
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
        <Pagination page={page} pages={pages} numberOfPages={Math.ceil(totalInventory / itemsPerPage)}
                    onPageChange={setPage} />
      </section>
    </div>
  );
};

export default InventoryManager;
