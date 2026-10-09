import React, { useState, useMemo } from 'react';
import { CatalogItem, CartItem, PostalOrder, PostalOrderShippingAddress } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { 
  ShoppingBag, 
  Search, 
  Truck, 
  ShieldCheck, 
  Anchor, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  ArrowRight, 
  Zap, 
  Package, 
  CreditCard, 
  Building2, 
  Printer, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface StoreFrontProps {
  catalog: CatalogItem[];
  cart: CartItem[];
  onAddToCart: (item: CatalogItem, quantity: number) => void;
  onUpdateCartQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onClearCart: () => void;
  onSubmitPostalOrder: (order: PostalOrder) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  onNavigateToPortal?: () => void;
  onNavigateToTracker?: (orderId?: string) => void;
}

export const StoreFront: React.FC<StoreFrontProps> = ({
  catalog,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onSubmitPostalOrder,
  isCartOpen,
  setIsCartOpen,
  onNavigateToPortal,
  onNavigateToTracker
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  // Cable custom length state per product
  const [selectedLengths, setSelectedLengths] = useState<{ [itemId: string]: number }>({});
  // Item added animation indicators
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Checkout flow state in Cart Drawer
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<PostalOrder | null>(null);

  // Checkout Form State
  const [deliveryType, setDeliveryType] = useState<'home' | 'marina'>('home');
  const [shippingMethod, setShippingMethod] = useState<'royal_mail_tracked' | 'dpd_heavy' | 'solent_pickup'>('royal_mail_tracked');
  const [formData, setFormData] = useState<PostalOrderShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Gosport',
    postcode: '',
    isMarinaDelivery: false,
    marinaName: 'Haslar Marina',
    berthNumber: '',
    deliveryNotes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 •••• •••• 4242',
    expiry: '12/28',
    cvc: '883',
    cardholderName: ''
  });

  // Calculate cart subtotal
  const cartSubtotal = useMemo(() => {
    return Number(cart.reduce((sum, item) => sum + (item.item.unitPrice * item.quantity), 0).toFixed(2));
  }, [cart]);

  // Shipping cost computation
  const shippingCost = useMemo(() => {
    if (cart.length === 0) return 0;
    if (shippingMethod === 'solent_pickup') return 0;
    if (shippingMethod === 'dpd_heavy') return 8.50;
    // Royal Mail Tracked
    return cartSubtotal >= 75 ? 0 : 4.50;
  }, [shippingMethod, cartSubtotal, cart.length]);

  const cartTotal = useMemo(() => {
    return Number((cartSubtotal + shippingCost).toFixed(2));
  }, [cartSubtotal, shippingCost]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  // Filter & Sort Products
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (inStockOnly && (!item.inStock || item.stockCount <= 0)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSpec = item.specification.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        return matchesName || matchesSpec || matchesCat;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.unitPrice - b.unitPrice;
      if (sortBy === 'price-desc') return b.unitPrice - a.unitPrice;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // featured/default
    });
  }, [catalog, selectedCategory, searchQuery, inStockOnly, sortBy]);

  // Handle Add To Cart with visual confirmation
  const handleAdd = (item: CatalogItem, qty: number) => {
    onAddToCart(item, qty);
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1800);
  };

  // Handle Place Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessingPayment(true);

    setTimeout(() => {
      const orderNum = `AJW-POST-${Math.floor(1000 + Math.random() * 9000)}`;
      const order: PostalOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        customerName: formData.fullName || 'Valued Marine Customer',
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          ...formData,
          isMarinaDelivery: deliveryType === 'marina'
        },
        shippingMethod,
        shippingCost,
        items: cart.map(c => ({
          itemId: c.item.id,
          name: c.item.name,
          unit: c.item.unit,
          quantity: c.quantity,
          unitPrice: c.item.unitPrice,
          lineTotal: Number((c.item.unitPrice * c.quantity).toFixed(2))
        })),
        subtotal: cartSubtotal,
        total: cartTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
        orderStatus: shippingMethod === 'solent_pickup' ? 'received' : 'received',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        notes: formData.deliveryNotes
      };

      onSubmitPostalOrder(order);
      setLastPlacedOrder(order);
      onClearCart();
      setIsProcessingPayment(false);
      setCheckoutStep('confirmation');
    }, 900);
  };

  const categories = [
    { id: 'all', label: 'All Stock Items' },
    { id: 'cable', label: 'Tinned Marine Cables' },
    { id: 'fuses', label: 'Fuses & Fuse Blocks' },
    { id: 'busbars', label: 'Busbars & Terminals' },
    { id: 'switches', label: 'Switches, Breakers & USB' },
    { id: 'victron', label: 'Victron Power Hardware' },
    { id: 'panels', label: 'Replica/Custom Panel Kits' }
  ];

  return (
    <div className="space-y-10">
      {/* Hero Banner for Store */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-3 py-1.5 rounded-full">
            <Package className="w-3.5 h-3.5" />
            <span>Gosport Workshop Stock · Direct UK Postal Orders</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Marine Electrical Parts &amp; Cable Dispatch
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Order genuine Oceanflex tinned marine wire cut to the exact meter, heavy-duty blade fuse blocks, Carling waterproof switches, and Victron hardware. Picked directly from our Gosport bench and posted same-day to your home address or Solent marina pontoon.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Oceanflex Tinned Wire</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Truck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Royal Mail &amp; DPD UK Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Anchor className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Direct Marina Pontoon Drop</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Free UK Postage over £75</span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Filters & Controls */}
      <section className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {categories.map(cat => {
            const count = cat.id === 'all' 
              ? catalog.length 
              : catalog.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 ring-1 ring-sky-400'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === cat.id ? 'bg-sky-700/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, In-Stock Toggle & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wire size, fuse, Carling, Victron, busbar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* In stock toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none px-2 py-1 bg-slate-950 border border-slate-800 rounded-xl">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
              />
              <span className="whitespace-nowrap">In Stock Only</span>
            </label>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="featured">Featured / Category</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>

            {/* Cart Trigger Button */}
            <button
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-lg shadow-sky-600/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Postal Order</span>
              {totalCartCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 bg-amber-400 text-slate-950 text-[11px] font-black rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section>
        {filteredCatalog.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No marine products found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try broadening your search term or clearing the "In Stock Only" filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setInStockOnly(false);
              }}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCatalog.map(product => {
              const isCable = product.category === 'cable';
              const selectedLen = selectedLengths[product.id] || (isCable ? 5 : 1);
              const isAdded = justAddedId === product.id;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={normalizeImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Package className="w-12 h-12" />
                      </div>
                    )}

                    {/* Stock Badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {product.stockCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-slate-950/85 backdrop-blur-sm border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{product.stockCount} in stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-slate-950/85 backdrop-blur-sm border border-rose-500/30 px-2 py-0.5 rounded-md">
                          <span>Awaiting workshop batch</span>
                        </span>
                      )}

                      {product.badge && (
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-950/90 backdrop-blur-sm border border-sky-500/30 px-2 py-0.5 rounded-md">
                          {product.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        {product.category} · {product.unit}
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {product.specification}
                      </p>
                    </div>

                    {/* Price and Unit */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-black text-white">
                          £{product.unitPrice.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          / {product.unit}
                        </span>
                      </div>
                      {isCable && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Cut to continuous length
                        </span>
                      )}
                    </div>

                    {/* Quantity / Meter Selector Controls */}
                    <div className="space-y-2 pt-1">
                      {isCable ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Length (meters):</span>
                            <span className="font-bold text-sky-400">{selectedLen}m = £{(selectedLen * product.unitPrice).toFixed(2)}</span>
                          </div>
                          {/* Quick meter pills */}
                          <div className="grid grid-cols-4 gap-1">
                            {[1, 5, 10, 25].map(len => (
                              <button
                                key={len}
                                type="button"
                                onClick={() => setSelectedLengths({ ...selectedLengths, [product.id]: len })}
                                className={`py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                                  selectedLen === len
                                    ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {len}m
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Quantity:</span>
                          <div className="inline-flex items-center border border-slate-800 rounded-lg bg-slate-950 p-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLengths({ 
                                ...selectedLengths, 
                                [product.id]: Math.max(1, selectedLen - 1) 
                              })}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-white">
                              {selectedLen}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedLengths({ 
                                ...selectedLengths, 
                                [product.id]: selectedLen + 1 
                              })}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Add to Postal Order Button */}
                      <button
                        onClick={() => handleAdd(product, selectedLen)}
                        disabled={product.stockCount <= 0}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          product.stockCount <= 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-sky-600 text-white hover:shadow-lg hover:shadow-sky-600/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Postal Order</span>
                          </>
                        ) : product.stockCount <= 0 ? (
                          <span>Out of Stock</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add {isCable ? `${selectedLen}m Wire` : `${selectedLen} to Order`}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Bottom Quick Cart Bar (when cart has items and drawer is closed) */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => {
              setCheckoutStep('cart');
              setIsCartOpen(true);
            }}
            className="flex items-center gap-3 bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-sky-900/50 border border-sky-400/30 transition-transform active:scale-95 group"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <div className="text-left text-xs">
              <div className="font-bold">View Postal Order</div>
              <div className="text-sky-200">£{cartSubtotal.toFixed(2)} + Postage</div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: Cart & Multi-Step Postal Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer container */}
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">
                  {checkoutStep === 'cart' && 'Your Postal Order Basket'}
                  {checkoutStep === 'shipping' && 'Delivery & Shipping Details'}
                  {checkoutStep === 'payment' && 'Confirm & Secure Payment'}
                  {checkoutStep === 'confirmation' && 'Order Placed Successfully!'}
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            {checkoutStep !== 'confirmation' && (
              <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className={`font-semibold flex items-center gap-1.5 ${
                    checkoutStep === 'cart' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                  <span>Items</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => cart.length > 0 && setCheckoutStep('shipping')}
                  disabled={cart.length === 0}
                  className={`font-semibold flex items-center gap-1.5 ${
                    checkoutStep === 'shipping' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                  <span>Postal Address</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => {
                    if (formData.fullName && formData.addressLine1 && formData.postcode) {
                      setCheckoutStep('payment');
                    }
                  }}
                  className={`font-semibold flex items-center gap-1.5 ${
                    checkoutStep === 'payment' ? 'text-sky-400' : 'text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                  <span>Payment</span>
                </button>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* STEP 1: CART REVIEW */}
              {checkoutStep === 'cart' && (
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm font-semibold text-slate-300">Your postal order is empty</p>
                      <p className="text-xs text-slate-500">
                        Add marine cables, blade fuses, or switches from the workshop catalog above.
                      </p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Browse Workshop Stock
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div
                          key={item.item.id}
                          className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
                        >
                          <div className="w-14 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                            {item.item.imageUrl ? (
                              <img src={normalizeImageUrl(item.item.imageUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 m-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {item.item.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              £{item.item.unitPrice.toFixed(2)} per {item.item.unit}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity Adjuster */}
                              <div className="inline-flex items-center border border-slate-800 rounded-lg bg-slate-900 p-0.5">
                                <button
                                  onClick={() => onUpdateCartQuantity(item.item.id, item.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateCartQuantity(item.item.id, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white">
                                  £{(item.item.unitPrice * item.quantity).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => onRemoveFromCart(item.item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Clear cart action */}
                      <div className="flex justify-end">
                        <button
                          onClick={onClearCart}
                          className="text-[11px] text-slate-500 hover:text-rose-400"
                        >
                          Clear Basket
                        </button>
                      </div>

                      {/* Shipping Option Preview */}
                      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-sky-400" />
                            <span>Select Shipping Speed</span>
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            {cartSubtotal >= 75 ? 'Free Standard Shipping Active' : `Add £${(75 - cartSubtotal).toFixed(2)} for free delivery`}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label 
                            onClick={() => setShippingMethod('royal_mail_tracked')}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                              shippingMethod === 'royal_mail_tracked' 
                                ? 'bg-sky-950/60 border-sky-500 text-white' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">Royal Mail Tracked 24/48</div>
                              <div className="text-[10px] text-slate-400">1–2 working days with tracking number</div>
                            </div>
                            <span className="font-bold text-emerald-400">
                              {cartSubtotal >= 75 ? 'FREE' : '£4.50'}
                            </span>
                          </label>

                          <label 
                            onClick={() => setShippingMethod('dpd_heavy')}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                              shippingMethod === 'dpd_heavy' 
                                ? 'bg-sky-950/60 border-sky-500 text-white' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">DPD Courier / Heavy Cable Spool</div>
                              <div className="text-[10px] text-slate-400">Next-day signed for heavy consignments</div>
                            </div>
                            <span className="font-bold">£8.50</span>
                          </label>

                          <label 
                            onClick={() => setShippingMethod('solent_pickup')}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                              shippingMethod === 'solent_pickup' 
                                ? 'bg-sky-950/60 border-sky-500 text-white' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">Gosport Workshop Collection</div>
                              <div className="text-[10px] text-slate-400">Pick up ready package from Anthony's bench</div>
                            </div>
                            <span className="font-bold text-emerald-400">FREE</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SHIPPING ADDRESS */}
              {checkoutStep === 'shipping' && (
                <div className="space-y-4">
                  {/* Delivery destination type selector */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('home')}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        deliveryType === 'home'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Home / Business Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('marina')}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        deliveryType === 'marina'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Anchor className="w-3.5 h-3.5" />
                      <span>Marina Pontoon Office</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Full Name / Boat Owner *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Captain David Mercer"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Email (for postal tracking) *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="david@example.co.uk"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Phone Number (for courier) *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="07700 900123"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {deliveryType === 'marina' ? (
                      <div className="space-y-3 p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl">
                        <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                          <Anchor className="w-3.5 h-3.5" />
                          <span>Solent Marina Delivery Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Marina Name</label>
                            <select
                              value={formData.marinaName}
                              onChange={e => setFormData({ ...formData, marinaName: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="Haslar Marina, Gosport">Haslar Marina (Gosport)</option>
                              <option value="Gosport Marina (Premier)">Gosport Marina (Premier)</option>
                              <option value="Port Hamble Marina">Port Hamble Marina</option>
                              <option value="Hamble Point Marina">Hamble Point Marina</option>
                              <option value="Swanwick Marina (Premier)">Swanwick Marina</option>
                              <option value="Cowes Yacht Haven">Cowes Yacht Haven (IOW)</option>
                              <option value="Portsmouth Harbour / Gunwharf">Gunwharf Quays Marina</option>
                              <option value="Southsea Marina (Premier)">Southsea Marina</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Berth / Pontoon #</label>
                            <input
                              type="text"
                              placeholder="e.g. Pontoon C-14"
                              value={formData.berthNumber || ''}
                              onChange={e => setFormData({ ...formData, berthNumber: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Marina Office Address Line 1</label>
                          <input
                            type="text"
                            placeholder="e.g. Haslar Marina Office, Haslar Road"
                            value={formData.addressLine1}
                            onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Postal Address Line 1 *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="House number & street name"
                            value={formData.addressLine1}
                            onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Apartment, suite, or boat name"
                            value={formData.addressLine2 || ''}
                            onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          UK Postcode *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PO12 1NU"
                          value={formData.postcode}
                          onChange={e => setFormData({ ...formData, postcode: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Dispatch &amp; Delivery Instructions (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Leave in porch safe place, or call on arrival at pontoon gate."
                        value={formData.deliveryNotes || ''}
                        onChange={e => setFormData({ ...formData, deliveryNotes: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT METHOD */}
              {checkoutStep === 'payment' && (
                <div className="space-y-4">
                  {/* Summary recap */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-white flex justify-between">
                      <span>Order Summary ({totalCartCount} items)</span>
                      <span>£{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Posting to: {formData.fullName}, {formData.addressLine1}, {formData.postcode}
                    </div>
                    <div className="text-[11px] text-sky-400">
                      Carrier: {shippingMethod === 'royal_mail_tracked' ? 'Royal Mail Tracked' : shippingMethod === 'dpd_heavy' ? 'DPD Courier' : 'Gosport Workshop Collection'}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-sky-950/70 border-sky-500 text-white shadow-lg'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-sky-400" />
                        <span>Credit / Debit Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all ${
                          paymentMethod === 'bank_transfer'
                            ? 'bg-sky-950/70 border-sky-500 text-white shadow-lg'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-5 h-5 text-amber-400" />
                        <span>Direct Bank Transfer (BACS)</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">Card Payment Details</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>256-bit Encrypted</span>
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder={formData.fullName || "Name on card"}
                            value={cardDetails.cardholderName}
                            onChange={e => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Card Number</label>
                          <input
                            type="text"
                            value={cardDetails.cardNumber}
                            onChange={e => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Expiry</label>
                            <input
                              type="text"
                              value={cardDetails.expiry}
                              onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">CVC / Security Code</label>
                            <input
                              type="text"
                              value={cardDetails.cvc}
                              onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          <span>Direct Marine Trade BACS Transfer</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Your order will be packed and reserved immediately. You can transfer directly from your online banking using your order number as reference. Goods dispatch as soon as payment clears.
                        </p>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                          <div>Bank: Lloyds Bank Marine Commercial</div>
                          <div>Account Name: AJW Marine Electrical</div>
                          <div>Sort Code: 30-93-74</div>
                          <div>Account No: 41829012</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: ORDER CONFIRMATION */}
              {checkoutStep === 'confirmation' && lastPlacedOrder && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Order Confirmed!</h3>
                    <p className="text-xs text-slate-400">
                      Reference: <span className="font-mono font-bold text-sky-400">{lastPlacedOrder.orderNumber}</span>
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-3">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-semibold text-white">{lastPlacedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Delivery Address:</span>
                      <span className="font-semibold text-white text-right max-w-[240px]">
                        {lastPlacedOrder.shippingAddress.addressLine1}, {lastPlacedOrder.shippingAddress.postcode}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-semibold text-white capitalize">
                        {lastPlacedOrder.shippingMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-1">
                      <span>Total Paid:</span>
                      <span className="text-emerald-400">£{lastPlacedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Next steps timeline */}
                  <div className="text-left bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>What Happens Next:</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-2 list-disc list-inside">
                      <li>Anthony picks your stock from the Gosport workshop.</li>
                      <li>Cable is measured and cut continuous, packaged in marine protective sleeves.</li>
                      <li>Royal Mail / DPD tracking number will be logged and dispatched within 24 hours.</li>
                    </ul>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Packing Receipt / Invoice</span>
                    </button>

                    {onNavigateToTracker && (
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          onNavigateToTracker(lastPlacedOrder.id);
                        }}
                        className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Track Order in Visual Timeline</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {onNavigateToPortal && (
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          onNavigateToPortal();
                        }}
                        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span>View in Client Vessel Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer with Totals & Next Step CTA */}
            {checkoutStep !== 'confirmation' && cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-3">
                {/* Financial Totals */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-white">£{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated UK Postage:</span>
                    <span className="font-semibold text-white">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-400 font-bold">FREE</span>
                      ) : (
                        `£${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Total Order:</span>
                    <span className="text-emerald-400">£{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Primary Action Button by Step */}
                {checkoutStep === 'cart' && (
                  <button
                    onClick={() => setCheckoutStep('shipping')}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all"
                  >
                    <span>Proceed to Delivery Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {checkoutStep === 'shipping' && (
                  <button
                    onClick={() => {
                      if (!formData.fullName || !formData.addressLine1 || !formData.postcode) {
                        alert('Please fill in your name, delivery address line 1, and UK postcode to proceed.');
                        return;
                      }
                      setCheckoutStep('payment');
                    }}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all"
                  >
                    <span>Proceed to Secure Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {checkoutStep === 'payment' && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessingPayment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing &amp; Packing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Place Postal Order (£{cartTotal.toFixed(2)})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
