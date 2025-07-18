import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce, useStableCallback } from "@/hooks/useOptimization";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  id
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchAddresses = useStableCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) API - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=8&countrycodes=gb,ie`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  });

  const debouncedSearch = useDebounce(searchAddresses, 150);

  const handleInputChange = useCallback((inputValue: string) => {
    onChange(inputValue);
    if (inputValue.length >= 2) {
      setIsOpen(true);
      debouncedSearch(inputValue);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [onChange, debouncedSearch]);

  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    const formattedAddress = formatDisplayAddress(suggestion);
    onChange(formattedAddress);
    setIsOpen(false);
    setSuggestions([]);
    
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
  }, [onChange, onAddressSelect]);

  const formatDisplayAddress = useCallback((suggestion: AddressSuggestion) => {
    const { address } = suggestion;
    const parts = [];
    
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    
    return parts.join(", ");
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            id={id}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn("pr-10", className)}
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Searching addresses...</CommandEmpty>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>No addresses found. Try typing more details.</CommandEmpty>
            ) : (
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    value={suggestion.display_name}
                    onSelect={() => handleAddressSelect(suggestion)}
                    className="flex items-start gap-2 p-3 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {formatDisplayAddress(suggestion)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {suggestion.display_name}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}