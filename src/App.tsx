import React, { useState, useEffect } from 'react';
import { UserRole, JobRecord, CatalogItem, CatalogSnapshot, MessageItem, MaterialLineItem, ServiceType, SwitchPanelConfig, VesselSpec, CartItem, PostalOrder, StockAlert, SupplierPurchaseOrder } from './types';
import { DEFAULT_CATALOG, INITIAL_JOBS, INITIAL_SAMPLE_PANEL, INITIAL_VESSEL_SPEC, INITIAL_POSTAL_ORDERS } from './data/seedData';
import { generateStockAlertEmail } from './data/supplierData';
import { Navigation } from './components/Navigation';
import { LandingHero } from './components/home/LandingHero';
import { ServicesSection } from './components/home/ServicesSection';
import { StoreFront } from './components/store/StoreFront';
import { SwitchPanelDesigner } from './components/panels/SwitchPanelDesigner';
import { ReplicaPanelUploader } from './components/panels/ReplicaPanelUploader';
import { ClientVesselPortal } from './components/client/ClientVesselPortal';
import { PostalOrderTracker } from './components/orders/PostalOrderTracker';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SupplierReorderModal } from './components/admin/SupplierReorderModal';
import { StockAlertEmailModal } from './components/admin/StockAlertEmailModal';
import { BookingQuoteModal } from './components/forms/BookingQuoteModal';
import { FreeHostingGuideModal } from './components/modals/FreeHostingGuideModal';
import { Logo } from './components/brand/Logo';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { ShieldCheck, MapPin, Clock, Github, HelpCircle, Phone, Mail, Bell, Truck, CheckCircle2, ArrowRight, X, AlertTriangle } from 'lucide-react';


export default function App() {
  // Persistence with localStorage fallback
  const [jobs, setJobs] = useState<JobRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_jobs');
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_catalog');
      return saved ? JSON.parse(saved) : DEFAULT_CATALOG;
    } catch {
      return DEFAULT_CATALOG;
    }
  });

  const [postalOrders, setPostalOrders] = useState<PostalOrder[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_postal_orders');
      return saved ? JSON.parse(saved) : INITIAL_POSTAL_ORDERS;
    } catch {
      return INITIAL_POSTAL_ORDERS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [vesselSpec, setVesselSpec] = useState<VesselSpec>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_vessel_spec');
      return saved ? JSON.parse(saved) : INITIAL_VESSEL_SPEC;
    } catch {
      return INITIAL_VESSEL_SPEC;
    }
  });

  const [snapshots, setSnapshots] = useState<CatalogSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_snapshots');
      return saved ? JSON.parse(saved) : [
        {
          id: 'snap-init',
          timestamp: '2026-10-07 10:00',
          label: 'Default 2026 Solent Baseline Catalog',
          itemsCount: DEFAULT_CATALOG.length,
          items: DEFAULT_CATALOG
        }
      ];
    } catch {
      return [];
    }
  });

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [portalSubTab, setPortalSubTab] = useState<'specs' | 'jobs' | 'orders'>('specs');
  const [trackedOrderId, setTrackedOrderId] = useState<string | undefined>(undefined);
  const [activeToast, setActiveToast] = useState<{
    id: string;
    orderNumber: string;
    status: string;
    headline: string;
    messageText: string;
    timestamp: string;
  } | null>(null);

  // Stock Alerts & Supplier Reorder State
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(() => {
    try {
      const saved = localStorage.getItem('ajwmes_stock_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeStockAlertToast, setActiveStockAlertToast] = useState<StockAlert | null>(null);
  const [supplierReorderItem, setSupplierReorderItem] = useState<CatalogItem | null>(null);
  const [viewingAlertEmail, setViewingAlertEmail] = useState<StockAlert | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('guest');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHostingGuideOpen, setIsHostingGuideOpen] = useState(false);
  const [selectedInitialService, setSelectedInitialService] = useState<ServiceType>('diagnostic');
  const [pendingPanelConfig, setPendingPanelConfig] = useState<SwitchPanelConfig | undefined>(undefined);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.warn('Failed to save jobs to localStorage', e);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_catalog', JSON.stringify(catalog));
    } catch (e) {
      console.warn('Failed to save catalog to localStorage', e);
    }
  }, [catalog]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_stock_alerts', JSON.stringify(stockAlerts));
    } catch (e) {
      console.warn('Failed to save stockAlerts to localStorage', e);
    }
  }, [stockAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_postal_orders', JSON.stringify(postalOrders));
    } catch (e) {
      console.warn('Failed to save postalOrders to localStorage', e);
    }
  }, [postalOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_vessel_spec', JSON.stringify(vesselSpec));
    } catch (e) {
      console.warn('Failed to save vesselSpec to localStorage', e);
    }
  }, [vesselSpec]);

  useEffect(() => {
    try {
      localStorage.setItem('ajwmes_snapshots', JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Failed to save snapshots to localStorage', e);
    }
  }, [snapshots]);

  // Auto-dismiss toast after 7 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Auto-dismiss zero-stock alert toast after 10 seconds
  useEffect(() => {
    if (!activeStockAlertToast) return;
    const timer = setTimeout(() => {
      setActiveStockAlertToast(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [activeStockAlertToast]);

  // Automated Zero-Stock Alert Trigger (Fires when stockCount hits 0)
  const triggerZeroStockAlert = (item: CatalogItem, triggerSource: StockAlert['triggerSource'] = 'manual_adjustment') => {
    const { subject, body } = generateStockAlertEmail(item, triggerSource);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAlert: StockAlert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      specification: item.specification,
      stockCount: 0,
      timestamp: `Today at ${timeStr}`,
      triggerSource,
      emailRecipient: 'anthonywrather@gmail.com',
      emailSubject: subject,
      emailBody: body
    };

    setStockAlerts(prev => [newAlert, ...prev]);
    setActiveStockAlertToast(newAlert);
  };

  // Restock item callback from SupplierReorderModal
  const handleRestockItem = (itemId: string, restockCount: number) => {
    setCatalog(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newCount = (item.stockCount ?? 0) + restockCount;
          return {
            ...item,
            stockCount: newCount,
            inStock: newCount > 0
          };
        }
        return item;
      })
    );
    // Dismiss zero stock toast for this item if open
    setActiveStockAlertToast(prev => prev && prev.itemId === itemId ? null : prev);
  };

  // Safe catalog updater that checks for transitions to stockCount = 0
  const handleUpdateCatalog = (newCatalog: CatalogItem[], triggerSource: StockAlert['triggerSource'] = 'manual_adjustment') => {
    newCatalog.forEach(newItem => {
      const prevItem = catalog.find(c => c.id === newItem.id);
      if (prevItem && (prevItem.stockCount ?? 0) > 0 && (newItem.stockCount ?? 0) === 0) {
        triggerZeroStockAlert(newItem, triggerSource);
      }
    });
    setCatalog(newCatalog);
  };


  // Handler: Send Message in Discussion Thread
  const handleSendMessage = (jobId: string, message: MessageItem) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId ? { ...j, messages: [...j.messages, message] } : j
      )
    );
  };

  // Handler: Approve Quote
  const handleApproveQuote = (jobId: string) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              status: 'quote_accepted',
              messages: [
                ...j.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'client',
                  senderName: j.clientName,
                  text: 'Quote accepted by boat owner. Ready to schedule diagnostics/fitment.',
                  timestamp: 'Just now'
                }
              ]
            }
          : j
      )
    );
  };

  // Handler: Pay Deposit via Stripe
  const handlePayDeposit = (jobId: string, amount: number) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              depositPaid: true,
              depositAmount: amount,
              status: j.status === 'quote_requested' ? 'scheduled' : j.status,
              messages: [
                ...j.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'client',
                  senderName: 'System / Stripe',
                  text: `£${amount}.00 deposit successfully secured via Stripe checkout.`,
                  timestamp: 'Just now'
                }
              ]
            }
          : j
      )
    );
  };

  // Handler: Save Labor & Materials Job Sheet (Admin)
  const handleSaveJobSheet = (jobId: string, hours: number, materials: MaterialLineItem[]) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== jobId) return j;
        const totalLabor = Number((hours * j.hourlyRate).toFixed(2));
        const totalMaterials = Number(
          materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0).toFixed(2)
        );
        return {
          ...j,
          diagnosticHours: hours,
          materialsUsed: materials,
          totalLabor,
          totalMaterials,
          totalEstimated: Number((totalLabor + totalMaterials).toFixed(2)),
          messages: [
            ...j.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'ajw',
              senderName: 'Anthony (AJW Marine)',
              text: `Updated on-vessel job sheet: ${hours}h diagnostic labor logged (£${totalLabor}) + ${materials.length} material items (£${totalMaterials}).`,
              timestamp: 'Just now'
            }
          ]
        };
      })
    );
  };

  // Handler: Submit Booking / Quote Request
  const handleSubmitBooking = (newJobData: Partial<JobRecord>) => {
    const fullJob: JobRecord = {
      id: `job-${Date.now()}`,
      reference: newJobData.reference || `AJW-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newJobData.clientName || 'Boat Owner',
      clientEmail: newJobData.clientEmail || 'client@example.co.uk',
      clientPhone: newJobData.clientPhone || '07700 900000',
      vesselName: newJobData.vesselName || 'Vessel',
      vesselType: newJobData.vesselType || 'Sailing Yacht',
      berthLocation: newJobData.berthLocation || 'Gosport',
      serviceCategory: newJobData.serviceCategory || 'diagnostic',
      status: 'quote_requested',
      hourlyRate: 25,
      diagnosticHours: 0,
      materialsUsed: [],
      notes: newJobData.notes || '',
      totalLabor: 25,
      totalMaterials: newJobData.totalMaterials || 0,
      totalEstimated: 25 + (newJobData.totalMaterials || 0),
      depositPaid: false,
      depositAmount: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      messages: newJobData.messages || [],
      replicaImages: newJobData.replicaImages,
      panelConfig: newJobData.panelConfig
    };

    setJobs([fullJob, ...jobs]);
    setCurrentUserRole('client');
    setCurrentTab('portal');
  };

  // Handler: Replica Quote Submission
  const handleReplicaQuote = (data: {
    boatMake: string;
    boatModel: string;
    dimensions: string;
    switchCount: number;
    materialPreference: string;
    imageUrls: string[];
    notes: string;
  }) => {
    const reference = `AJW-REP-${Math.floor(100 + Math.random() * 900)}`;
    const fullJob: JobRecord = {
      id: `job-${Date.now()}`,
      reference,
      clientName: 'Replica Inquirer',
      clientEmail: 'owner@westerly-owners.co.uk',
      clientPhone: '07700 900331',
      vesselName: `${data.boatMake} ${data.boatModel}`,
      vesselType: `${data.boatMake} Yacht`,
      berthLocation: 'Gosport Marina',
      serviceCategory: 'replica_panel',
      status: 'quote_requested',
      hourlyRate: 25,
      diagnosticHours: 0,
      materialsUsed: [],
      notes: `Replica switch panel quote request for ${data.boatMake} ${data.boatModel}. Dimensions approx: ${data.dimensions}, ${data.switchCount} switches. Notes: ${data.notes}`,
      replicaImages: data.imageUrls,
      totalLabor: 25,
      totalMaterials: 65,
      totalEstimated: 90,
      depositPaid: false,
      depositAmount: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          senderName: 'Boat Owner',
          text: `Uploaded photos and measurements for a ${data.boatMake} ${data.boatModel} replacement switch panel.`,
          timestamp: 'Just now'
        }
      ]
    };

    setJobs([fullJob, ...jobs]);
    setCurrentUserRole('client');
    setCurrentTab('portal');
  };

  // Catalog Snapshot Controls
  const handleCreateSnapshot = (label: string) => {
    const snap: CatalogSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      label,
      itemsCount: catalog.length,
      items: [...catalog]
    };
    setSnapshots([snap, ...snapshots]);
  };

  const handleRestoreSnapshot = (snapshot: CatalogSnapshot) => {
    setCatalog([...snapshot.items]);
    alert(`Catalog restored to save point: "${snapshot.label}" (${snapshot.itemsCount} items)`);
  };

  // Cart & Store Front Handlers
  const handleAddToCart = (item: CatalogItem, quantity: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(c => c.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }
      return [...prev, { item, quantity }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(c => c.item.id === itemId ? { ...c, quantity: newQuantity } : c)
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubmitPostalOrder = (order: PostalOrder) => {
    setPostalOrders(prev => [order, ...prev]);
    // Decrement stock from catalog and trigger alert if hits 0
    setCatalog(prev =>
      prev.map(catItem => {
        const ordered = order.items.find(i => i.itemId === catItem.id);
        if (ordered) {
          const newStock = Math.max(0, catItem.stockCount - ordered.quantity);
          const updatedItem = {
            ...catItem,
            stockCount: newStock,
            inStock: newStock > 0
          };
          if ((catItem.stockCount ?? 0) > 0 && newStock === 0) {
            triggerZeroStockAlert(updatedItem, 'order_placement');
          }
          return updatedItem;
        }
        return catItem;
      })
    );
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: PostalOrder['orderStatus'],
    trackingNumber?: string,
    carrier?: string
  ) => {
    const existingOrder = postalOrders.find(o => o.id === orderId);
    const orderNumber = existingOrder?.orderNumber || orderId;
    const resolvedTracking = trackingNumber || existingOrder?.trackingNumber || (status === 'dispatched' ? `GB${Math.floor(100000000 + Math.random() * 900000000)}RM` : undefined);
    const resolvedCarrier = carrier || existingOrder?.trackingCarrier || 'Royal Mail Tracked 24';

    // 1. Update postal orders state
    setPostalOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          orderStatus: status,
          trackingNumber: resolvedTracking || o.trackingNumber,
          trackingCarrier: resolvedCarrier || o.trackingCarrier,
          dispatchedAt: status === 'dispatched' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : o.dispatchedAt,
          deliveredAt: status === 'delivered' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : o.deliveredAt
        };
      })
    );

    // 2. Generate simulated activity feed notification message
    const destinationLabel = existingOrder?.shippingAddress.isMarinaDelivery
      ? `${existingOrder.shippingAddress.marinaName} (${existingOrder.shippingAddress.berthNumber || 'Berth Pontoon'})`
      : existingOrder
      ? `${existingOrder.shippingAddress.addressLine1}, ${existingOrder.shippingAddress.postcode}`
      : 'registered delivery address';

    let headline = '';
    let notificationBody = '';

    switch (status) {
      case 'dispatched':
        headline = `Postal Order Dispatched (${orderNumber})`;
        notificationBody = `Your parts parcel has been dispatched from the Gosport workshop via ${resolvedCarrier}. Tracking Number: ${resolvedTracking || 'Active'}. In transit to ${destinationLabel}.`;
        break;
      case 'delivered':
        headline = `Postal Order Delivered (${orderNumber})`;
        notificationBody = `Consignment delivery confirmed to ${destinationLabel}. All ordered marine wiring and electrical components safely arrived on vessel.`;
        break;
      case 'processing':
      case 'packed':
        headline = `Order Bench Assembly & Packing (${orderNumber})`;
        notificationBody = `Your order is on the Gosport bench: continuous tinned marine cables measured & cut, terminal crimps verified, and sealed in weatherproof packaging.`;
        break;
      case 'ready_for_pickup':
        headline = `Ready for Solent Collection (${orderNumber})`;
        notificationBody = `Order ${orderNumber} is packaged and ready for collection at Anthony's Gosport workshop or Haslar drop-off point.`;
        break;
      case 'pending':
      case 'received':
      default:
        headline = `Postal Order Queued (${orderNumber})`;
        notificationBody = `Order ${orderNumber} is confirmed and added to the workshop fulfillment schedule. Stock components reserved.`;
        break;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activityMessage: MessageItem = {
      id: `msg-dispatch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: 'ajw',
      senderName: 'Anthony (Workshop Postal Dispatch)',
      text: `📦 [${headline}]\n${notificationBody}`,
      timestamp: `Today at ${timeStr}`
    };

    // 3. Automatically push to the client's job portal activity feed
    setJobs(prevJobs => {
      // Find matching job for this order's client
      const matchingJob = existingOrder ? prevJobs.find(j =>
        j.clientEmail.toLowerCase() === existingOrder.customerEmail.toLowerCase() ||
        j.clientName.toLowerCase() === existingOrder.customerName.toLowerCase()
      ) : null;

      return prevJobs.map(job => {
        // If matched by customer email/name, update that job.
        // Also update the primary client job (job-101) so it is immediately visible in the demo portal!
        if (matchingJob ? (job.id === matchingJob.id || job.id === 'job-101') : (job.id === 'job-101' || job === prevJobs[0])) {
          return {
            ...job,
            messages: [...job.messages, activityMessage]
          };
        }
        return job;
      });
    });

    // 4. Trigger simulated real-time notification toast
    setActiveToast({
      id: `toast-${Date.now()}`,
      orderNumber,
      status: status.replace(/_/g, ' '),
      headline,
      messageText: notificationBody,
      timestamp: 'Just now'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        onOpenBookingModal={() => {
          setSelectedInitialService('diagnostic');
          setIsBookingModalOpen(true);
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => {
          setCurrentTab('store');
          setIsCartOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Tab 1: Home Landing Page */}
        {currentTab === 'home' && (
          <div className="space-y-16">
            <LandingHero
              onOpenDesigner={() => setCurrentTab('designer')}
              onOpenQuote={() => {
                setSelectedInitialService('diagnostic');
                setIsBookingModalOpen(true);
              }}
              onOpenReplica={() => setCurrentTab('replica')}
              onOpenStore={() => setCurrentTab('store')}
              onOpenTracker={() => setCurrentTab('tracker')}
            />

            <ServicesSection
              onSelectService={serviceKey => {
                if (serviceKey === 'panels') {
                  setCurrentTab('designer');
                } else if (serviceKey === 'store') {
                  setCurrentTab('store');
                } else {
                  setSelectedInitialService(serviceKey as ServiceType);
                  setIsBookingModalOpen(true);
                }
              }}
            />
          </div>
        )}

        {/* Tab 2: Online Parts Store Front & Postal Dispatch */}
        {currentTab === 'store' && (
          <StoreFront
            catalog={catalog}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onSubmitPostalOrder={handleSubmitPostalOrder}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            onNavigateToPortal={() => {
              setCurrentUserRole('client');
              setCurrentTab('portal');
            }}
            onNavigateToTracker={(orderId) => {
              setTrackedOrderId(orderId);
              setCurrentTab('tracker');
            }}
          />
        )}

        {/* Tab 3: Postal Order Tracker */}
        {currentTab === 'tracker' && (
          <PostalOrderTracker
            orders={postalOrders}
            selectedOrderId={trackedOrderId}
            onSelectOrder={setTrackedOrderId}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onNavigateToStore={() => setCurrentTab('store')}
          />
        )}

        {/* Tab 3: Replica/Custom Switch Panel Designer */}
        {currentTab === 'designer' && (
          <SwitchPanelDesigner
            onOrderPanel={cfg => {
              setPendingPanelConfig(cfg);
              setSelectedInitialService('custom_panel');
              setIsBookingModalOpen(true);
            }}
          />
        )}

        {/* Tab 4: Replica Switch Panel Upload */}
        {currentTab === 'replica' && (
          <div className="max-w-4xl mx-auto">
            <ReplicaPanelUploader onSubmitReplicaQuote={handleReplicaQuote} />
          </div>
        )}

        {/* Tab 5: Signed-in Boat Owner Vessel Portal */}
        {currentTab === 'portal' && (
          <ClientVesselPortal
            jobs={jobs}
            clientEmail="d.mercer@solent-sail.co.uk"
            vesselSpec={vesselSpec}
            postalOrders={postalOrders}
            activeSubTab={portalSubTab}
            onSubTabChange={setPortalSubTab}
            onUpdateVesselSpec={setVesselSpec}
            onSendMessage={handleSendMessage}
            onApproveQuote={handleApproveQuote}
            onPayDeposit={handlePayDeposit}
            onRequestNewService={() => {
              setSelectedInitialService('diagnostic');
              setIsBookingModalOpen(true);
            }}
            onNavigateToStore={() => setCurrentTab('store')}
            onNavigateToTracker={(orderId) => {
              setTrackedOrderId(orderId);
              setCurrentTab('tracker');
            }}
          />
        )}

        {/* Tab 6: Anthony's Admin & Workshop Dashboard */}
        {currentTab === 'admin' && (
          <AdminDashboard
            jobs={jobs}
            catalog={catalog}
            snapshots={snapshots}
            postalOrders={postalOrders}
            stockAlerts={stockAlerts}
            onSendMessage={handleSendMessage}
            onSaveJobSheet={handleSaveJobSheet}
            onUpdateCatalog={handleUpdateCatalog}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenSupplierReorder={setSupplierReorderItem}
            onViewAlertEmail={setViewingAlertEmail}
          />
        )}
      </main>

      {/* Booking & Quote Modal */}
      <BookingQuoteModal
        isOpen={isBookingModalOpen}
        initialService={selectedInitialService}
        initialPanelConfig={pendingPanelConfig}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPendingPanelConfig(undefined);
        }}
        onSubmitBooking={handleSubmitBooking}
      />

      {/* Free Hosting & GitHub Setup Modal */}
      <FreeHostingGuideModal
        isOpen={isHostingGuideOpen}
        onClose={() => setIsHostingGuideOpen(false)}
      />

      {/* Supplier Purchase Order Reorder Drafting Modal */}
      <SupplierReorderModal
        isOpen={!!supplierReorderItem}
        item={supplierReorderItem}
        onClose={() => setSupplierReorderItem(null)}
        onConfirmRestock={handleRestockItem}
      />

      {/* Automated Stock Depletion Email Alert Modal */}
      <StockAlertEmailModal
        isOpen={!!viewingAlertEmail}
        alert={viewingAlertEmail}
        onClose={() => setViewingAlertEmail(null)}
        onOpenSupplierReorder={(itemId) => {
          const item = catalog.find(c => c.id === itemId);
          if (item) {
            setSupplierReorderItem(item);
          }
        }}
      />

      {/* Automated Stock Depletion Toast Notification (Admin Zero-Stock Alert) */}
      {activeStockAlertToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-slate-900/98 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-400 shrink-0 shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/40">
                  🚨 Admin Zero-Stock Alert
                </span>
                <span className="text-[10px] text-slate-400">{activeStockAlertToast.timestamp}</span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white">
                {activeStockAlertToast.itemName} hit 0 units!
              </h4>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Stock is completely depleted. Automated stock alert email sent to <span className="font-mono text-rose-300 font-semibold">{activeStockAlertToast.emailRecipient}</span>.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const item = catalog.find(c => c.id === activeStockAlertToast.itemId);
                    if (item) {
                      setSupplierReorderItem(item);
                    }
                    setActiveStockAlertToast(null);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Reorder from Supplier</span>
                </button>

                <button
                  onClick={() => {
                    setViewingAlertEmail(activeStockAlertToast);
                    setActiveStockAlertToast(null);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>View Alert Email</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveStockAlertToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Simulated Postal Dispatch Notification Toast */}
      {activeToast && !activeStockAlertToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-slate-900/95 border border-sky-500/60 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30">
                  Live Dispatch Notification
                </span>
                <span className="text-[10px] text-slate-500">{activeToast.timestamp}</span>
              </div>

              <h4 className="text-xs font-bold text-white">
                {activeToast.headline}
              </h4>

              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                {activeToast.messageText}
              </p>

              <div className="pt-1.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentTab('portal');
                    setPortalSubTab('jobs');
                    setCurrentUserRole('client');
                    setActiveToast(null);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-sky-600/30 cursor-pointer"
                >
                  <span>View in Job Portal Feed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setTrackedOrderId(activeToast.orderNumber);
                    setCurrentTab('tracker');
                    setActiveToast(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Track Order</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Logo size="md" />

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Flat Rate £25 / Hour + Materials</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Gosport, Hampshire (1-Hour Travel Zone)</span>
              </span>
              <button
                onClick={() => setIsHostingGuideOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Free Hosting &amp; GitHub Setup Guide</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 AJW Marine Electrical Services (AJWMES) · Anthony Wrather · All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Haslar Marina</span>
              <span>·</span>
              <span>Gosport Marina</span>
              <span>·</span>
              <span>Port Solent</span>
              <span>·</span>
              <span>River Hamble</span>
              <span>·</span>
              <span>Chichester</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
