import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, ExternalLink, Filter, Search, X, Globe, Building2, ChevronDown } from "lucide-react";
import { useReactions } from "@/hooks/use-reactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  regions: string[] | null;
  firm_sizes: string[] | null;
  likes_count: number | null;
  categories?: string[];
}

const regionLabels: Record<string, string> = {
  NA: "North America",
  EMEA: "Europe/Middle East",
  APAC: "Asia Pacific",
  LAC: "Latin America",
};

const firmSizeLabels: Record<string, string> = {
  solo: "Solo",
  small: "Small (2-10)",
  medium: "Medium (11-50)",
  large: "Large (51-200)",
  enterprise: "Enterprise (200+)",
};

export default function Martech() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedFirmSizes, setSelectedFirmSizes] = useState<string[]>([]);
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const { isLiked, isLoading, toggleReaction } = useReactions({
    targetType: "vendor",
    targetIds: vendors.map(v => v.id),
  });

  const handleFollow = async (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    
    const wasLiked = isLiked(vendorId);
    
    // Optimistically update the UI
    setVendors(prev => prev.map(vendor => 
      vendor.id === vendorId 
        ? { ...vendor, likes_count: (vendor.likes_count || 0) + (wasLiked ? -1 : 1) }
        : vendor
    ));
    
    await toggleReaction(vendorId);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: catData } = await supabase
        .from("martech_categories")
        .select("*")
        .order("name");

      if (catData) setCategories(catData);

      // Fetch vendors with their categories
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .order("name");

      if (vendorData) {
        // Fetch vendor categories
        const { data: vcData } = await supabase
          .from("vendor_categories")
          .select("vendor_id, category_id");

        const vendorsWithCategories = vendorData.map((vendor) => {
          const vendorCatIds = vcData?.filter((vc) => vc.vendor_id === vendor.id).map((vc) => vc.category_id) || [];
          const vendorCatNames = catData?.filter((c) => vendorCatIds.includes(c.id)).map((c) => c.name) || [];
          return { ...vendor, categories: vendorCatNames };
        });

        setVendors(vendorsWithCategories);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Get unique regions and firm sizes from vendors
  const availableRegions = [...new Set(vendors.flatMap(v => v.regions || []))];
  const availableFirmSizes = [...new Set(vendors.flatMap(v => v.firm_sizes || []))];

  const filteredVendors = vendors.filter((v) => {
    const matchesCategory = selectedCategory ? v.categories?.includes(selectedCategory) : true;
    const matchesSearch = searchQuery
      ? v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesRegion = selectedRegions.length === 0 || 
      selectedRegions.some(r => v.regions?.includes(r));
    const matchesFirmSize = selectedFirmSizes.length === 0 || 
      selectedFirmSizes.some(s => v.firm_sizes?.includes(s));
    const matchesFollowed = !showFollowedOnly || isLiked(v.id);
    
    return matchesCategory && matchesSearch && matchesRegion && matchesFirmSize && matchesFollowed;
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedRegions([]);
    setSelectedFirmSizes([]);
    setShowFollowedOnly(false);
    setSearchQuery("");
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || selectedRegions.length > 0 || 
    selectedFirmSizes.length > 0 || showFollowedOnly || searchQuery;

  return (
    <AppLayout>
      <HeroBanner
        emoji="🗺️"
        title="Martech Map"
        description="Navigate the legal technology landscape. Discover tools for CRM, content, experience management, and more."
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedCategory ? "default" : "outline"} size="sm">
                {selectedCategory || "Category"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={selectedCategory === null}
                onCheckedChange={() => setSelectedCategory(null)}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {categories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={selectedCategory === cat.name}
                  onCheckedChange={() => setSelectedCategory(cat.name)}
                >
                  {cat.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Region Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedRegions.length > 0 ? "default" : "outline"} size="sm">
                <Globe className="h-4 w-4 mr-1" />
                Region {selectedRegions.length > 0 && `(${selectedRegions.length})`}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableRegions.map((region) => (
                <DropdownMenuCheckboxItem
                  key={region}
                  checked={selectedRegions.includes(region)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRegions([...selectedRegions, region]);
                    } else {
                      setSelectedRegions(selectedRegions.filter(r => r !== region));
                    }
                  }}
                >
                  {regionLabels[region] || region}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Firm Size Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedFirmSizes.length > 0 ? "default" : "outline"} size="sm">
                <Building2 className="h-4 w-4 mr-1" />
                Firm Size {selectedFirmSizes.length > 0 && `(${selectedFirmSizes.length})`}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableFirmSizes.map((size) => (
                <DropdownMenuCheckboxItem
                  key={size}
                  checked={selectedFirmSizes.includes(size)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFirmSizes([...selectedFirmSizes, size]);
                    } else {
                      setSelectedFirmSizes(selectedFirmSizes.filter(s => s !== size));
                    }
                  }}
                >
                  {firmSizeLabels[size] || size}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Followed Only */}
          <Button
            variant={showFollowedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFollowedOnly(!showFollowedOnly)}
          >
            <Heart className={`h-4 w-4 mr-1 ${showFollowedOnly ? "fill-current" : ""}`} />
            Following
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </p>

        {/* Vendor Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-16 h-16 bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters."
                : "Vendors are being added. Check back soon!"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="group hover:shadow-elevated transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedVendor(vendor)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    {vendor.logo_url ? (
                      <img
                        src={vendor.logo_url}
                        alt={vendor.name}
                        className="w-12 h-12 object-contain rounded-lg bg-muted p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {vendor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleFollow(e, vendor.id)}
                      disabled={isLoading(vendor.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                        isLiked(vendor.id)
                          ? "bg-red-500/10 text-red-500"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked(vendor.id) ? "fill-current" : ""}`} />
                      <span className="text-sm">{vendor.likes_count || 0}</span>
                    </button>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {vendor.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {vendor.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {vendor.categories?.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat.replace("Legal ", "").replace(" & ", "/")}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {vendor.regions?.map((region) => (
                      <Badge key={region} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Detail Modal */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  {selectedVendor.logo_url ? (
                    <img
                      src={selectedVendor.logo_url}
                      alt={selectedVendor.name}
                      className="w-16 h-16 object-contain rounded-lg bg-muted p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-2xl">
                        {selectedVendor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-2xl">{selectedVendor.name}</DialogTitle>
                    <button
                      onClick={(e) => handleFollow(e, selectedVendor.id)}
                      disabled={isLoading(selectedVendor.id)}
                      className={`flex items-center gap-2 mt-1 px-3 py-1 rounded-full transition-colors ${
                        isLiked(selectedVendor.id)
                          ? "bg-red-500/10 text-red-500"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked(selectedVendor.id) ? "fill-current" : ""}`} />
                      <span>{isLiked(selectedVendor.id) ? "Following" : "Follow"}</span>
                    </button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <DialogDescription className="text-base">
                  {selectedVendor.description}
                </DialogDescription>

                <div>
                  <h4 className="font-semibold mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.categories?.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedVendor.regions && selectedVendor.regions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Regions</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.regions.map((region) => (
                        <Badge key={region} variant="outline">
                          {regionLabels[region] || region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVendor.firm_sizes && selectedVendor.firm_sizes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Firm Sizes</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.firm_sizes.map((size) => (
                        <Badge key={size} variant="outline" className="capitalize">
                          {firmSizeLabels[size] || size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVendor.website_url && (
                  <Button asChild className="w-full">
                    <a
                      href={selectedVendor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
