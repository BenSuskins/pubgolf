'use client';

import { useState } from 'react';
import { searchPlaces } from '@/lib/api';
import { PlaceSearchResult } from '@/lib/types';

interface PubSearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSearchResult) => void;
  biasLatitude?: number;
  biasLongitude?: number;
  placeholder?: string;
}

export default function PubSearchAutocomplete({
  value,
  onChange,
  onSelect,
  biasLatitude,
  biasLongitude,
  placeholder = 'Search for a pub or bar…',
}: PubSearchAutocompleteProps) {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!value || value.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const places = await searchPlaces(value, biasLatitude, biasLongitude);
      setResults(places);
      if (places.length === 0) {
        setError('No results found');
      }
    } catch (err) {
      console.error('Failed to search places:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (place: PlaceSearchResult) => {
    onSelect(place);
    onChange('');
    setResults([]);
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" stroke="var(--color-text-secondary)" strokeWidth="1.8" />
          <path d="M21 21l-4.3-4.3" stroke="var(--color-text-secondary)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-3 pl-10 pr-4 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] text-[14.5px] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          aria-label="Search for a pub"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={isLoading || value.length < 2}
        className="w-full py-3 px-4 rounded-xl bg-[var(--color-surface-inset)] border border-[var(--color-border-gold)] text-[var(--color-accent)] font-bold text-[13px] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-xl">{error}</p>
      )}

      {results.length > 0 && (
        <div className="glass rounded-[14px] overflow-hidden max-h-60 overflow-y-auto" aria-label="Search results">
          {results.map((place, index) => (
            <div
              key={`${place.name}-${place.latitude}-${place.longitude}`}
              className={`flex items-center gap-3 px-3.5 py-3 ${
                index > 0 ? 'border-t border-[var(--color-border)]/50' : ''
              }`}
            >
              <span className="w-[34px] h-[34px] rounded-lg bg-[var(--color-border-subtle)] flex items-center justify-center shrink-0" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21Z"
                    stroke="var(--color-text-secondary)"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="9.5" r="2.4" stroke="var(--color-text-secondary)" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="flex-1 min-w-0 font-semibold text-[13.5px] text-[var(--color-text)] truncate">
                {place.name}
              </span>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                aria-label={`Add ${place.name}`}
                className="w-9 h-9 rounded-[9px] bg-[var(--color-surface-inset)] border border-[var(--color-border-gold)] text-[var(--color-accent)] text-lg shrink-0 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
