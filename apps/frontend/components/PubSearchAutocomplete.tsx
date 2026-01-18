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
  placeholder = 'Search for a pub...',
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
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-[var(--color-text-secondary)]/50"
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
        className="w-full px-4 py-2 btn-gradient rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">{error}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">Results:</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map((place) => (
              <button
                key={`${place.name}-${place.latitude}-${place.longitude}`}
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-2 text-left bg-[var(--color-bg)] hover:bg-[var(--color-bg-hover)] rounded-md border border-[var(--color-border)] transition-colors"
              >
                <div className="font-medium truncate">{place.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
