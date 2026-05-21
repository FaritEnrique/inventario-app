import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "./Modal";

const EMPTY_ITEMS = [];

const CatalogoSelectorModal = ({
  isOpen,
  onClose,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  items = EMPTY_ITEMS,
  loading = false,
  selectedId = "",
  onSelect,
  onClearSelection,
  getOptionLabel,
  getOptionDescription,
  emptyMessage = "No hay elementos disponibles.",
  emptyStateHint = "",
  emptyStateActionLabel = "",
  emptyStateActionTo = "",
}) => {
  const searchInputId = useId();
  const searchInputRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedSelectedId =
    selectedId === null || selectedId === undefined ? "" : String(selectedId);
  const selectedIndex = useMemo(
    () => items.findIndex((item) => String(item.id) === normalizedSelectedId),
    [items, normalizedSelectedId],
  );

  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, items.length);
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : items.length > 0 ? 0 : -1);
  }, [isOpen, items.length, selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;
    if (items.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((current) => {
      if (current >= 0 && current < items.length) {
        return current;
      }
      return selectedIndex >= 0 ? selectedIndex : 0;
    });
  }, [isOpen, items.length, selectedIndex]);

  useEffect(() => {
    if (activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  const commitSelection = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  const moveActiveIndex = (delta) => {
    if (items.length === 0) return;
    setActiveIndex((current) => {
      if (current < 0) {
        return delta > 0 ? 0 : items.length - 1;
      }

      const nextIndex = current + delta;
      if (nextIndex < 0) return items.length - 1;
      if (nextIndex >= items.length) return 0;
      return nextIndex;
    });
  };

  const handleSearchKeyDown = (event) => {
    if (items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && activeIndex < items.length) {
      event.preventDefault();
      commitSelection(items[activeIndex]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-3xl"
      bodyClassName="px-0 pb-0 pt-5"
    >
      <div className="space-y-4">
        <div className="px-6">
          <label
            htmlFor={searchInputId}
            className="block text-sm font-medium text-gray-700"
          >
            {searchLabel}
          </label>
          <input
            id={searchInputId}
            name={searchInputId}
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            autoComplete="off"
          />
        </div>

        <div className="border-y border-gray-200">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Cargando opciones...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-gray-700">{emptyMessage}</p>
              {emptyStateHint ? (
                <p className="mt-2 text-sm text-gray-500">{emptyStateHint}</p>
              ) : null}
              {emptyStateActionLabel && emptyStateActionTo ? (
                <Link
                  to={emptyStateActionTo}
                  onClick={() => onClose?.()}
                  className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {emptyStateActionLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto p-3">
              <div className="space-y-2" role="listbox" aria-label={title}>
                {items.map((item, index) => {
                  const optionId = String(item.id);
                  const selected = optionId === normalizedSelectedId;
                  const active = index === activeIndex;
                  const description = getOptionDescription?.(item);

                  return (
                    <button
                      key={optionId}
                      type="button"
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        commitSelection(item);
                      }}
                      className={`block w-full rounded-lg border px-4 py-3 text-left transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50"
                          : active
                            ? "border-indigo-300 bg-indigo-50/50"
                            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-900">
                        {getOptionLabel(item)}
                      </span>
                      {description ? (
                        <span className="mt-1 block text-xs text-gray-500">
                          {description}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:justify-end">
          {normalizedSelectedId ? (
            <button
              type="button"
              onClick={() => {
                onClearSelection?.();
                onClose?.();
              }}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Limpiar selección
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CatalogoSelectorModal;
