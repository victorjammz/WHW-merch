import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce, useStableCallback } from "@/hooks/useOptimization";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

interface ExpandedAddress {
  address: string;
  city: string;
  country: string;
  postcode: string;
}

interface PostcodeAutocompleteProps {
  onAddressComplete: (address: ExpandedAddress) => void;
  className?: string;
}

export function PostcodeAutocomplete({ onAddressComplete, className }: PostcodeAutocompleteProps) {
  const [postcode, setPostcode] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExpandedForm, setShowExpandedForm] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [expandedAddress, setExpandedAddress] = useState<ExpandedAddress>({
    address: "",
    city: "",
    country: "",
    postcode: ""
  });

  const searchPostcodes = useStableCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search specifically for postcodes
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=10&countrycodes=gb,ie&class=place&type=postcode`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Error fetching postcode suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  });

  const debouncedSearch = useDebounce(searchPostcodes, 200);

  const handlePostcodeChange = useCallback((inputValue: string) => {
    setPostcode(inputValue);
    if (inputValue.length >= 4) {
      setIsOpen(true);
      debouncedSearch(inputValue);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    const { address } = suggestion;
    const fullAddress = formatFullAddress(suggestion);
    
    setExpandedAddress({
      address: fullAddress,
      city: address.city || address.suburb || "",
      country: address.country || "United Kingdom",
      postcode: address.postcode || postcode
    });
    
    setPostcode(address.postcode || postcode);
    setIsOpen(false);
    setSuggestions([]);
    setShowExpandedForm(true);
  }, [postcode]);

  const formatFullAddress = useCallback((suggestion: AddressSuggestion) => {
    const { address } = suggestion;
    const parts = [];
    
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    if (address.suburb && address.suburb !== address.city) parts.push(address.suburb);
    
    return parts.join(", ");
  }, []);

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setShowExpandedForm(true);
    setExpandedAddress({
      address: "",
      city: "",
      country: "United Kingdom",
      postcode: postcode || ""
    });
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleExpandedFormChange = (field: keyof ExpandedAddress, value: string) => {
    setExpandedAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = () => {
    if (expandedAddress.address && expandedAddress.city && expandedAddress.postcode) {
      onAddressComplete(expandedAddress);
    }
  };

  const resetForm = () => {
    setPostcode("");
    setShowExpandedForm(false);
    setShowManualEntry(false);
    setExpandedAddress({
      address: "",
      city: "",
      country: "",
      postcode: ""
    });
    setSuggestions([]);
  };

  if (showExpandedForm) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Address Details</h3>
          <Button variant="ghost" size="sm" onClick={resetForm}>
            Start Over
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={expandedAddress.address}
              onChange={(e) => handleExpandedFormChange("address", e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={expandedAddress.city}
              onChange={(e) => handleExpandedFormChange("city", e.target.value)}
              placeholder="London"
            />
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={expandedAddress.country}
              onChange={(e) => handleExpandedFormChange("country", e.target.value)}
              placeholder="United Kingdom"
            />
          </div>
          
          <div>
            <Label htmlFor="expanded-postcode">Postcode</Label>
            <Input
              id="expanded-postcode"
              value={expandedAddress.postcode}
              onChange={(e) => handleExpandedFormChange("postcode", e.target.value)}
              placeholder="SW1A 1AA"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleComplete}
          disabled={!expandedAddress.address || !expandedAddress.city || !expandedAddress.postcode}
          className="w-full"
        >
          Confirm Address
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="postcode">Postcode</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="postcode"
                value={postcode}
                onChange={(e) => handlePostcodeChange(e.target.value)}
                placeholder="Enter postcode (e.g., SW1A 1AA)"
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandList>
                {isLoading ? (
                  <CommandEmpty>Searching postcodes...</CommandEmpty>
                ) : suggestions.length === 0 && postcode.length >= 4 ? (
                  <CommandEmpty>No postcodes found. Try a different postcode.</CommandEmpty>
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
                          <div className="font-medium">
                            {suggestion.address.postcode || postcode}
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
      </div>
      
      <Button
        variant="outline"
        onClick={handleManualEntry}
        className="w-full"
      >
        <Edit3 className="h-4 w-4 mr-2" />
        Enter Address Manually
      </Button>
    </div>
  );
}