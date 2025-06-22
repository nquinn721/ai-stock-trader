import React, { useState, useRef, useEffect } from 'react';
import './StockAutocomplete.css';

interface Stock {
  symbol: string;
  name: string;
}

interface StockAutocompleteProps {
  stocks: Stock[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const StockAutocomplete: React.FC<StockAutocompleteProps> = ({
  stocks,
  value,
  onChange,
  placeholder = "Search stock symbol...",
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter stocks based on input value
  useEffect(() => {
    if (!value.trim()) {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(value.toLowerCase()) ||
          stock.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, stocks]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Handle input blur (with delay to allow click on dropdown)
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  // Handle stock selection
  const handleStockSelect = (stock: Stock) => {
    onChange(stock.symbol);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredStocks.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredStocks[highlightedIndex]) {
          handleStockSelect(filteredStocks[highlightedIndex]);
        } else if (filteredStocks.length === 1) {
          handleStockSelect(filteredStocks[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlighted = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlighted) {
        highlighted.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`stock-autocomplete ${className}`}>
      <div className="autocomplete-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="autocomplete-input"
          autoComplete="off"
          spellCheck="false"
        />
        {isOpen && (
          <div className="autocomplete-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {isOpen && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          {filteredStocks.length > 0 ? (
            <>
              {filteredStocks.map((stock, index) => (
                <div
                  key={stock.symbol}
                  className={`autocomplete-option ${
                    index === highlightedIndex ? 'highlighted' : ''
                  }`}
                  onClick={() => handleStockSelect(stock)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="option-symbol">{stock.symbol}</div>
                  <div className="option-name">{stock.name}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="autocomplete-no-results">
              <div className="no-results-text">No stocks found</div>
              <div className="no-results-hint">
                Try searching for: AAPL, GOOGL, MSFT, AMZN, TSLA, NVDA, META, NFLX
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAutocomplete;
