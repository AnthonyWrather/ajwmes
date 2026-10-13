import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, JobRecord, CatalogItem, CategoryItem, CatalogSnapshot, MessageItem, MaterialLineItem, ServiceType, SwitchPanelConfig, VesselSpec, CartItem, PostalOrder, StockAlert, SupplierPurchaseOrder, FirestoreConnectionState } from './types';
import { DEFAULT_CATALOG, DEFAULT_CATEGORIES, INITIAL_JOBS, INITIAL_SAMPLE_PANEL, INITIAL_VESSEL_SPEC, INITIAL_POSTAL_ORDERS } from './data/seedData';
import { generateStockAlertEmail } from './data/supplierData';
import { Navigation } from './components/Navigation';
import { FirestoreSyncBanner } from './components/common/FirestoreSyncBanner';
import { LandingHero } from './components/home/LandingHero';
import { ServicesSection } from './components/home/ServicesSection';
import { StoreFront } from './components/store/StoreFront';
import { SwitchPanelDesigner } from './components/panels/SwitchPanelDesigner';
import { ReplicaPanelUploader } from './components/panels/ReplicaPanelUploader';
import { ClientVesselPortal } from './components/client/ClientVesselPortal';
import { PostalOrderTracker } from './components/orders/PostalOrderTracker';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TechnicianWorkspace } from './components/technician/TechnicianWorkspace';
import { PostalWorkspace } from './components/postal/PostalWorkspace';
import { AuthModal } from './components/auth/AuthModal';
import { SignInModal } from './components/auth/SignInModal';
import { SignOffModal } from './components/auth/SignOffModal';
import { AccountManagementModal } from './components/auth/AccountManagementModal';
import { 
  getSavedRole, 
  saveCurrentRole, 
  getSavedUserProfile, 
  saveUserProfile, 
  saveAndSyncUserProfile,
  syncUserRoleToFirestore,
  enrichUserProfile,
  subscribeAuthState,
  DEMO_PROFILES, 
  ROLE_CONFIGS 
} from './lib/auth';
import { SupplierReorderModal } from './components/admin/SupplierReorderModal';
import { StockAlertEmailModal } from './components/admin/StockAlertEmailModal';
import { BookingQuoteModal } from './components/forms/BookingQuoteModal';
import { FreeHostingGuideModal } from './components/modals/FreeHostingGuideModal';
import { Logo } from './components/brand/Logo';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { ShieldCheck, MapPin, Clock, Github, HelpCircle, Phone, Mail, Bell, Truck, CheckCircle2, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { 
  AppRoute, 
  RbacAction, 
  canAccessRoute, 
  canPerformAction, 
  enforceAction, 
  ActionCheckResult, 
  getDefaultRouteForRole 
} from './lib/rbac';
import { RBACRouteGuard } from './components/rbac/RBACRouteGuard';
import { RBACPermissionsModal } from './components/rbac/RBACPermissionsModal';
import { RBACActionDeniedToast } from './components/rbac/RBACActionDeniedToast';
import { 
  subscribeJobs, 
  syncJobToFirestore, 
  subscribeCatalog, 
  syncCatalogItemToFirestore, 
  deleteCatalogItemFromFirestore,
  deleteCatalogItemImage,
  seedCatalogToFirestore, 
  subscribeCategories,
  syncCategoryToFirestore,
  deleteCategoryFromFirestore,
  seedCategoriesToFirestore,
  subscribePostalOrders, 
  syncPostalOrderToFirestore, 
  subscribeVesselSpec, 
  syncVesselSpecToFirestore,
  subscribeUsers,
  syncUserToFirestore,
  seedUsersToFirestore,
  deleteUserFromFirestore,
  subscribeConnectionState,
  retryFirestoreConnection,
  toggleSimulatedOffline,
  getConnectionState
} from './lib/firebase';
import { trackPageView, trackAddToCart, trackPurchase, trackQuoteRequest } from './lib/analytics';
import { 
  getEnvStorageItem, 
  setEnvStorageItem, 
  getEnvironmentSeedData, 
  resetEnvironmentToTestData 
} from './lib/envStorage';
import { detectEnvironment } from './lib/environment';
import { EnvironmentSettingsModal } from './components/modals/EnvironmentSettingsModal';


export default function App() {
  // Persistence with environment-scoped localStorage partitioning
  const envSeed = getEnvironmentSeedData();

  const [jobs, setJobs] = useState<JobRecord[]>(() => {
    return getEnvStorageItem('jobs', envSeed.jobs);
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    return getEnvStorageItem('catalog', envSeed.catalog);
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    return getEnvStorageItem('categories', envSeed.categories || DEFAULT_CATEGORIES);
  });

  const [postalOrders, setPostalOrders] = useState<PostalOrder[]>(() => {
    return getEnvStorageItem('postal_orders', envSeed.postalOrders);
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    return getEnvStorageItem('cart', []);
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);

  const [vesselSpec, setVesselSpec] = useState<VesselSpec>(() => {
    return getEnvStorageItem('vessel_spec', envSeed.vesselSpec);
  });

  const [snapshots, setSnapshots] = useState<CatalogSnapshot[]>(() => {
    return getEnvStorageItem('snapshots', [
      {
        id: 'snap-init',
        timestamp: '2026-10-07 10:00',
        label: 'Default 2026 Solent Baseline Catalog',
        itemsCount: envSeed.catalog.length,
        items: envSeed.catalog
      }
    ]);
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

  // RBAC State Management
  const [isPermissionsMatrixOpen, setIsPermissionsMatrixOpen] = useState(false);
  const [actionDenial, setActionDenial] = useState<ActionCheckResult | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => getSavedRole());
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>(() => getSavedUserProfile());
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    return getEnvStorageItem('users_list', envSeed.users);
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [signInInitialTab, setSignInInitialTab] = useState<'signin' | 'register' | 'quick_personas'>('signin');
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authToast, setAuthToast] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHostingGuideOpen, setIsHostingGuideOpen] = useState(false);
  const [selectedInitialService, setSelectedInitialService] = useState<ServiceType>('diagnostic');
  const [pendingPanelConfig, setPendingPanelConfig] = useState<SwitchPanelConfig | undefined>(undefined);
  const [connectionState, setConnectionState] = useState<FirestoreConnectionState>(() => getConnectionState());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(connectionState.isConnected);

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentUserRole(newRole);
    saveCurrentRole(newRole);
    const demoProfile = DEMO_PROFILES.find(p => p.role === newRole);
    if (demoProfile) {
      const enriched = enrichUserProfile(demoProfile);
      setCurrentUserProfile(enriched);
      saveUserProfile(enriched);
      syncUserRoleToFirestore(demoProfile.id, newRole);
    } else if (currentUserProfile) {
      const updated = enrichUserProfile({ ...currentUserProfile, role: newRole, updatedAt: new Date().toISOString() });
      setCurrentUserProfile(updated);
      saveAndSyncUserProfile(updated);
    }
    // Automatically switch to the active workspace for this role
    setCurrentTab(getDefaultRouteForRole(newRole));
  };

  const handleSuccessSignIn = (profile: UserProfile) => {
    const enriched = enrichUserProfile(profile);
    setCurrentUserProfile(enriched);
    setCurrentUserRole(enriched.role);
    saveUserProfile(enriched);
    saveAndSyncUserProfile(enriched);
    setAuthToast({
      title: `Welcome, ${enriched.name}`,
      message: `Signed in successfully with ${ROLE_CONFIGS[enriched.role].label} permissions. Active in Firestore database.`,
      type: 'success'
    });
    // Immediately navigate to the primary workspace for this role
    setCurrentTab(getDefaultRouteForRole(enriched.role));
  };

  const handleConfirmSignOff = () => {
    const guestProfile = DEMO_PROFILES.find(p => p.role === 'guest') || DEMO_PROFILES[4];
    setCurrentUserProfile(guestProfile);
    setCurrentUserRole('guest');
    saveUserProfile(guestProfile);
    setAuthToast({
      title: 'Signed Off',
      message: 'You have signed off. Browsing in public Guest Visitor mode.',
      type: 'info'
    });
    if (!canAccessRoute('guest', currentTab as AppRoute)) {
      setCurrentTab(getDefaultRouteForRole('guest'));
    }
  };

  // Auto-dismiss auth toast after 6 seconds
  useEffect(() => {
    if (!authToast) return;
    const timer = setTimeout(() => setAuthToast(null), 6000);
    return () => clearTimeout(timer);
  }, [authToast]);

  const handleUpdateJobStatus = (jobId: string, newStatus: JobRecord['status']) => {
    enforceAction(
      currentUserRole,
      'update_job_status',
      () => {
        setJobs(prev =>
          prev.map(j => {
            if (j.id !== jobId) return j;
            const updated: JobRecord = { ...j, status: newStatus };
            syncJobToFirestore(updated);
            return updated;
          })
        );
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Subscribe to reactive Firestore connection state
  useEffect(() => {
    const unsubConnection = subscribeConnectionState((state) => {
      setConnectionState(state);
      setIsFirebaseConnected(state.isConnected);
    });
    return () => unsubConnection();
  }, []);

  const handleRetryConnection = async () => {
    return await retryFirestoreConnection();
  };

  const handleToggleSimulatedOffline = async (forceOffline: boolean) => {
    return await toggleSimulatedOffline(forceOffline);
  };

  // Firestore Real-time Synchronization
  useEffect(() => {
    // Seed default baseline catalog & initial user accounts if remote collections are empty
    seedCatalogToFirestore(DEFAULT_CATALOG).catch(err => console.warn('Catalog seeding skipped or cached:', err));
    seedCategoriesToFirestore(DEFAULT_CATEGORIES).catch(err => console.warn('Categories seeding skipped or cached:', err));
    seedUsersToFirestore(DEMO_PROFILES).catch(err => console.warn('Users seeding skipped or cached:', err));

    const unsubJobs = subscribeJobs((remoteJobs) => {
      if (remoteJobs && remoteJobs.length > 0) {
        setJobs(remoteJobs);
      }
      setIsFirebaseConnected(true);
    });

    const unsubCatalog = subscribeCatalog((remoteCatalog) => {
      if (remoteCatalog && remoteCatalog.length > 0) {
        setCatalog(remoteCatalog);
      }
      setIsFirebaseConnected(true);
    });

    const unsubCategories = subscribeCategories((remoteCategories) => {
      if (remoteCategories && remoteCategories.length > 0) {
        setCategories(remoteCategories);
      }
      setIsFirebaseConnected(true);
    });

    const unsubOrders = subscribePostalOrders((remoteOrders) => {
      if (remoteOrders && remoteOrders.length > 0) {
        setPostalOrders(remoteOrders);
      }
      setIsFirebaseConnected(true);
    });

    const unsubSpec = subscribeVesselSpec((remoteSpec) => {
      if (remoteSpec && remoteSpec.id) {
        setVesselSpec(remoteSpec);
      }
      setIsFirebaseConnected(true);
    });

    const unsubUsers = subscribeUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsersList(remoteUsers);
        setCurrentUserProfile((prev) => {
          const match = remoteUsers.find((u) => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
          if (match) {
            const enriched = enrichUserProfile({ ...prev, ...match });
            if (enriched.role && enriched.role !== prev.role) {
              setCurrentUserRole(enriched.role);
              saveCurrentRole(enriched.role);
            }
            return enriched;
          }
          return prev;
        });
      }
      setIsFirebaseConnected(true);
    });

    return () => {
      unsubJobs();
      unsubCatalog();
      unsubCategories();
      unsubOrders();
      unsubSpec();
      unsubUsers();
    };
  }, []);

  // Listen to Firebase Authentication state for active session persistence
  useEffect(() => {
    const unsubAuth = subscribeAuthState((fbUser) => {
      if (fbUser) {
        const cleanEmail = fbUser.email?.toLowerCase() || '';
        const isAnthony = cleanEmail === 'anthonywrather@gmail.com';
        const assignedRole: UserRole = isAnthony ? 'admin' : 'client';
        const baseProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || (isAnthony ? 'Anthony Wrather' : (cleanEmail ? cleanEmail.split('@')[0] : 'Marine User')),
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '',
          role: assignedRole,
          avatarUrl: fbUser.photoURL || undefined,
          photoURL: fbUser.photoURL || undefined,
          vesselName: isAnthony ? 'AJW Solent Response' : '',
          vesselType: isAnthony ? 'Workboat / Fast Tender' : 'Sailing Yacht',
          marinaBerth: isAnthony ? 'Gosport Marina (HQ Workshop)' : '',
          systemVoltage: '12V',
          notifyJobUpdates: true,
          notifyDispatchSms: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const enriched = enrichUserProfile(baseProfile);
        setCurrentUserProfile(enriched);
        setCurrentUserRole(enriched.role);
        saveUserProfile(enriched);
      }
    });

    return () => unsubAuth();
  }, []);

  // Helper: Reload state when environment or test dataset is changed from modal
  const handleEnvironmentDataReload = () => {
    const seed = getEnvironmentSeedData();
    setJobs(getEnvStorageItem('jobs', seed.jobs));
    setCatalog(getEnvStorageItem('catalog', seed.catalog));
    setCategories(getEnvStorageItem('categories', seed.categories || DEFAULT_CATEGORIES));
    setPostalOrders(getEnvStorageItem('postal_orders', seed.postalOrders));
    setVesselSpec(getEnvStorageItem('vessel_spec', seed.vesselSpec));
    setUsersList(getEnvStorageItem('users_list', seed.users));
    setCart(getEnvStorageItem('cart', []));
  };

  // Sync usersList to environment-scoped storage
  useEffect(() => {
    setEnvStorageItem('users_list', usersList);
  }, [usersList]);

  const handleSaveUserToDatabase = async (user: UserProfile) => {
    await syncUserToFirestore(user);
    setUsersList(prev => {
      const idx = prev.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [user, ...prev];
    });
    if (currentUserProfile.id === user.id || currentUserProfile.email.toLowerCase() === user.email.toLowerCase()) {
      setCurrentUserProfile(user);
      setCurrentUserRole(user.role);
    }
  };

  const handleUpdateUserRoleInDatabase = async (userId: string, newRole: UserRole) => {
    await syncUserRoleToFirestore(userId, newRole);
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUserProfile.id === userId) {
      setCurrentUserRole(newRole);
      setCurrentUserProfile(prev => ({ ...prev, role: newRole }));
    }
  };

  const handleDeleteUserFromDatabase = async (userId: string) => {
    await deleteUserFromFirestore(userId);
    setUsersList(prev => prev.filter(u => u.id !== userId));
  };

  // Sync state to environment-scoped storage
  useEffect(() => {
    setEnvStorageItem('jobs', jobs);
  }, [jobs]);

  useEffect(() => {
    setEnvStorageItem('catalog', catalog);
  }, [catalog]);

  useEffect(() => {
    setEnvStorageItem('categories', categories);
  }, [categories]);

  useEffect(() => {
    setEnvStorageItem('stock_alerts', stockAlerts);
  }, [stockAlerts]);

  useEffect(() => {
    setEnvStorageItem('postal_orders', postalOrders);
  }, [postalOrders]);

  useEffect(() => {
    setEnvStorageItem('cart', cart);
  }, [cart]);

  useEffect(() => {
    setEnvStorageItem('vessel_spec', vesselSpec);
  }, [vesselSpec]);

  useEffect(() => {
    setEnvStorageItem('snapshots', snapshots);
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

  // Auto-dismiss action denial toast after 8 seconds
  useEffect(() => {
    if (!actionDenial) return;
    const timer = setTimeout(() => {
      setActionDenial(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [actionDenial]);

  // Google Analytics 4 (GA4): Track SPA navigation page views on tab changes
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      home: 'Home | AJW Marine Electrical Services',
      store: 'Workshop Store & Cables | AJW Marine',
      designer: 'Laser Switch Panel Designer | AJW Marine',
      replica: 'Replica Boat Switch Panels | AJW Marine',
      portal: 'Vessel Portal & Diagnostics | AJW Marine',
      tracker: 'Track Postal Orders | AJW Marine',
      admin: 'Workshop Admin Dashboard | AJW Marine',
      technician: 'Field Technician Workspace | AJW Marine',
      postal: 'Postal Dispatch Desk | AJW Marine',
    };
    trackPageView(currentTab, tabTitles[currentTab] || `AJW Marine - ${currentTab}`);
  }, [currentTab]);

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

  // Restock item callback from SupplierReorderModal (Admin only)
  const handleRestockItem = (itemId: string, restockCount: number) => {
    enforceAction(
      currentUserRole,
      'restock_catalog_inventory',
      () => {
        setCatalog(prev =>
          prev.map(item => {
            if (item.id === itemId) {
              const newCount = (item.stockCount ?? 0) + restockCount;
              const updatedItem = {
                ...item,
                stockCount: newCount,
                inStock: newCount > 0
              };
              syncCatalogItemToFirestore(updatedItem);
              return updatedItem;
            }
            return item;
          })
        );
        // Dismiss zero stock toast for this item if open
        setActiveStockAlertToast(prev => prev && prev.itemId === itemId ? null : prev);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Safe catalog updater that checks for transitions to stockCount = 0 (Admin only)
  const handleUpdateCatalog = (newCatalog: CatalogItem[], triggerSource: StockAlert['triggerSource'] = 'manual_adjustment') => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        newCatalog.forEach(newItem => {
          const prevItem = catalog.find(c => c.id === newItem.id);
          if (prevItem && (prevItem.stockCount ?? 0) > 0 && (newItem.stockCount ?? 0) === 0) {
            triggerZeroStockAlert(newItem, triggerSource);
          }
          syncCatalogItemToFirestore(newItem);
        });
        setCatalog(newCatalog);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Add Item (Admin only)
  const handleAddItem = (newItem: CatalogItem) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        setCatalog(prev => [newItem, ...prev]);
        syncCatalogItemToFirestore(newItem);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Edit / Modify Item (Admin only)
  const handleEditItem = (updatedItem: CatalogItem) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        const prevItem = catalog.find(item => item.id === updatedItem.id);
        // If image was replaced or cleared, delete the old image if it was uploaded
        if (
          prevItem &&
          prevItem.imageStoragePath &&
          prevItem.imageStoragePath !== updatedItem.imageStoragePath
        ) {
          deleteCatalogItemImage(prevItem.imageStoragePath);
        }
        setCatalog(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        syncCatalogItemToFirestore(updatedItem);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Delete Item (Admin only) - deletes item and associated image
  const handleDeleteItem = (itemId: string) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        const itemToDelete = catalog.find(item => item.id === itemId);
        if (itemToDelete) {
          if (itemToDelete.imageStoragePath) {
            deleteCatalogItemImage(itemToDelete.imageStoragePath);
          } else if (itemToDelete.imageUrl) {
            deleteCatalogItemImage(itemToDelete.imageUrl);
          }
        }
        setCatalog(prev => prev.filter(item => item.id !== itemId));
        deleteCatalogItemFromFirestore(itemId);
        setCart(prev => prev.filter(c => c.item.id !== itemId));
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Add Category (Admin only)
  const handleAddCategory = (newCat: CategoryItem) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        setCategories(prev => [...prev, newCat]);
        syncCategoryToFirestore(newCat);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Edit / Modify Category (Admin only)
  const handleEditCategory = (oldId: string, updatedCat: CategoryItem) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        setCategories(prev => prev.map(c => c.id === oldId ? updatedCat : c));
        if (oldId !== updatedCat.id) {
          deleteCategoryFromFirestore(oldId);
          setCatalog(prev => {
            const next = prev.map(i => i.category === oldId ? { ...i, category: updatedCat.id } : i);
            next.forEach(item => {
              if (item.category === updatedCat.id) {
                syncCatalogItemToFirestore(item);
              }
            });
            return next;
          });
        }
        syncCategoryToFirestore(updatedCat);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Delete Category (Admin only)
  const handleDeleteCategory = (categoryId: string, reassignToCategoryId?: string) => {
    enforceAction(
      currentUserRole,
      'edit_catalog_pricing',
      () => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        deleteCategoryFromFirestore(categoryId);
        if (reassignToCategoryId) {
          setCatalog(prev => {
            const next = prev.map(i => i.category === categoryId ? { ...i, category: reassignToCategoryId } : i);
            next.forEach(item => {
              if (item.category === reassignToCategoryId) {
                syncCatalogItemToFirestore(item);
              }
            });
            return next;
          });
        }
      },
      (denial) => setActionDenial(denial)
    );
  };


  // Handler: Send Message in Discussion Thread
  const handleSendMessage = (jobId: string, message: MessageItem) => {
    const requiredAction: RbacAction = message.sender === 'client' ? 'send_client_message' : 'send_technician_message';
    enforceAction(
      currentUserRole,
      requiredAction,
      () => {
        setJobs(prev =>
          prev.map(j => {
            if (j.id === jobId) {
              const updated = { ...j, messages: [...j.messages, message] };
              syncJobToFirestore(updated);
              return updated;
            }
            return j;
          })
        );
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Handler: Approve Quote (Client or Admin)
  const handleApproveQuote = (jobId: string) => {
    enforceAction(
      currentUserRole,
      'approve_quote',
      () => {
        setJobs(prev =>
          prev.map(j => {
            if (j.id === jobId) {
              const updated: JobRecord = {
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
              };
              syncJobToFirestore(updated);
              return updated;
            }
            return j;
          })
        );
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Handler: Pay Deposit via Stripe (Client or Admin)
  const handlePayDeposit = (jobId: string, amount: number) => {
    enforceAction(
      currentUserRole,
      'pay_deposit',
      () => {
        setJobs(prev =>
          prev.map(j => {
            if (j.id === jobId) {
              const updated: JobRecord = {
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
              };
              syncJobToFirestore(updated);
              return updated;
            }
            return j;
          })
        );
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Handler: Save Labor & Materials Job Sheet (Technician or Admin)
  const handleSaveJobSheet = (jobId: string, hours: number, materials: MaterialLineItem[]) => {
    enforceAction(
      currentUserRole,
      'log_diagnostic_hours',
      () => {
        setJobs(prev =>
          prev.map(j => {
            if (j.id !== jobId) return j;
            const totalLabor = Number((hours * j.hourlyRate).toFixed(2));
            const totalMaterials = Number(
              materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0).toFixed(2)
            );
            const updated: JobRecord = {
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
            syncJobToFirestore(updated);
            return updated;
          })
        );
      },
      (denial) => setActionDenial(denial)
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
    syncJobToFirestore(fullJob);
    trackQuoteRequest({
      serviceCategory: fullJob.serviceCategory,
      vesselName: fullJob.vesselName,
      reference: fullJob.reference,
      estimatedValue: fullJob.totalEstimated
    });
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
    syncJobToFirestore(fullJob);
    trackQuoteRequest({
      serviceCategory: 'replica_panel',
      vesselName: fullJob.vesselName,
      reference: fullJob.reference,
      estimatedValue: fullJob.totalEstimated
    });
    setCurrentUserRole('client');
    setCurrentTab('portal');
  };

  // Catalog Snapshot Controls (Admin only)
  const handleCreateSnapshot = (label: string) => {
    enforceAction(
      currentUserRole,
      'create_catalog_snapshot',
      () => {
        const snap: CatalogSnapshot = {
          id: `snap-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          label,
          itemsCount: catalog.length,
          items: [...catalog]
        };
        setSnapshots([snap, ...snapshots]);
      },
      (denial) => setActionDenial(denial)
    );
  };

  const handleRestoreSnapshot = (snapshot: CatalogSnapshot) => {
    enforceAction(
      currentUserRole,
      'restore_catalog_snapshot',
      () => {
        setCatalog([...snapshot.items]);
        alert(`Catalog restored to save point: "${snapshot.label}" (${snapshot.itemsCount} items)`);
      },
      (denial) => setActionDenial(denial)
    );
  };

  // Cart & Store Front Handlers
  const handleAddToCart = (item: CatalogItem, quantity: number) => {
    trackAddToCart(item, quantity);
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
    syncPostalOrderToFirestore(order);
    trackPurchase(order);
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
          syncCatalogItemToFirestore(updatedItem);
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
    enforceAction(
      currentUserRole,
      'update_postal_status',
      () => {
        const existingOrder = postalOrders.find(o => o.id === orderId);
        const orderNumber = existingOrder?.orderNumber || orderId;
        const resolvedTracking = trackingNumber || existingOrder?.trackingNumber || (status === 'dispatched' ? `GB${Math.floor(100000000 + Math.random() * 900000000)}RM` : undefined);
        const resolvedCarrier = carrier || existingOrder?.trackingCarrier || 'Royal Mail Tracked 24';

        // 1. Update postal orders state
        setPostalOrders(prev =>
          prev.map(o => {
            if (o.id !== orderId) return o;
            const updatedOrder: PostalOrder = {
              ...o,
              orderStatus: status,
              trackingNumber: resolvedTracking || o.trackingNumber,
              trackingCarrier: resolvedCarrier || o.trackingCarrier,
              packedAt: (status === 'packed' || status === 'ready_for_pickup' || status === 'dispatched' || status === 'delivered') ? (o.packedAt || new Date().toISOString().slice(0, 16).replace('T', ' ')) : o.packedAt,
              dispatchedAt: (status === 'dispatched' || status === 'delivered') ? (o.dispatchedAt || new Date().toISOString().slice(0, 16).replace('T', ' ')) : o.dispatchedAt,
              deliveredAt: status === 'delivered' ? (o.deliveredAt || new Date().toISOString().slice(0, 16).replace('T', ' ')) : o.deliveredAt
            };
            syncPostalOrderToFirestore(updatedOrder);
            return updatedOrder;
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
      },
      (denial) => setActionDenial(denial)
    );
  };

  const handleUpdateVesselSpec = (newSpec: VesselSpec) => {
    enforceAction(
      currentUserRole,
      'edit_vessel_spec',
      () => {
        setVesselSpec(newSpec);
        syncVesselSpecToFirestore(newSpec);
      },
      (denial) => setActionDenial(denial)
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle UI Indicator at the top of the app: Warns users if disconnected from Firestore */}
      <FirestoreSyncBanner
        connectionState={connectionState}
        onRetry={handleRetryConnection}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        onOpenEnvironmentSettings={() => setIsEnvironmentModalOpen(true)}
      />

      {/* Top Bar Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={handleRoleChange}
        onOpenBookingModal={() => {
          setSelectedInitialService('diagnostic');
          setIsBookingModalOpen(true);
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => {
          setCurrentTab('store');
          setIsCartOpen(true);
        }}
        isFirebaseConnected={isFirebaseConnected}
        onRetrySync={handleRetryConnection}
        isCheckingSync={connectionState.isChecking}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
        currentUserProfile={currentUserProfile}
        onOpenSignInModal={() => {
          setSignInInitialTab('signin');
          setIsSignInModalOpen(true);
        }}
        onOpenTeamRoles={() => {
          setSignInInitialTab('quick_personas');
          setIsSignInModalOpen(true);
        }}
        onOpenSignOffModal={() => setIsSignOffModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenEnvironmentSettings={() => setIsEnvironmentModalOpen(true)}
      />

      {/* Main Container with Centralized RBAC Route Middleware Guard */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <RBACRouteGuard
          route={currentTab as AppRoute}
          userRole={currentUserRole}
          onRedirect={(targetRoute) => setCurrentTab(targetRoute)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
        >
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
              categories={categories}
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

          {/* Tab 4: Replica/Custom Switch Panel Designer */}
          {currentTab === 'designer' && (
            <SwitchPanelDesigner
              onOrderPanel={cfg => {
                setPendingPanelConfig(cfg);
                setSelectedInitialService('custom_panel');
                setIsBookingModalOpen(true);
              }}
            />
          )}

          {/* Tab 5: Replica Switch Panel Upload */}
          {currentTab === 'replica' && (
            <div className="max-w-4xl mx-auto">
              <ReplicaPanelUploader onSubmitReplicaQuote={handleReplicaQuote} />
            </div>
          )}

          {/* Tab 6: Signed-in Boat Owner Vessel Portal */}
          {currentTab === 'portal' && (
            <ClientVesselPortal
              jobs={jobs}
              clientEmail={currentUserProfile.email}
              vesselSpec={vesselSpec}
              postalOrders={postalOrders}
              activeSubTab={portalSubTab}
              onSubTabChange={setPortalSubTab}
              onUpdateVesselSpec={handleUpdateVesselSpec}
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
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
          )}

          {/* Tab 7: Anthony's Master Workshop Dashboard (Admin only) */}
          {currentTab === 'admin' && (
            <AdminDashboard
              jobs={jobs}
              catalog={catalog}
              categories={categories}
              snapshots={snapshots}
              postalOrders={postalOrders}
              stockAlerts={stockAlerts}
              users={usersList}
              onSendMessage={handleSendMessage}
              onSaveJobSheet={handleSaveJobSheet}
              onUpdateCatalog={handleUpdateCatalog}
              onCreateSnapshot={handleCreateSnapshot}
              onRestoreSnapshot={handleRestoreSnapshot}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenSupplierReorder={setSupplierReorderItem}
              onViewAlertEmail={setViewingAlertEmail}
              onSaveUser={handleSaveUserToDatabase}
              onUpdateUserRole={handleUpdateUserRoleInDatabase}
              onDeleteUser={handleDeleteUserFromDatabase}
              onRefreshUsers={() => seedUsersToFirestore(DEMO_PROFILES)}
              onAddCatalogItem={handleAddItem}
              onEditCatalogItem={handleEditItem}
              onDeleteCatalogItem={handleDeleteItem}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* Tab 8: Solent Marine Technician Workstation (Technician or Admin) */}
          {currentTab === 'technician' && (
            <TechnicianWorkspace
              jobs={jobs}
              catalog={catalog}
              onSendMessage={handleSendMessage}
              onSaveJobSheet={handleSaveJobSheet}
              onUpdateJobStatus={handleUpdateJobStatus}
            />
          )}

          {/* Tab 9: Workshop Postal Dispatch Station (Postal or Admin) */}
          {currentTab === 'postal' && (
            <PostalWorkspace
              orders={postalOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}
        </RBACRouteGuard>
      </main>

      {/* Dedicated Sign In & Vessel Registration Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        currentUserRole={currentUserRole}
        onSuccessSignIn={handleSuccessSignIn}
        initialTab={signInInitialTab}
      />

      {/* Reassuring Sign Off Confirmation Modal */}
      <SignOffModal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        currentUserProfile={currentUserProfile}
        currentUserRole={currentUserRole}
        onConfirmSignOff={handleConfirmSignOff}
      />

      {/* Comprehensive Account Management & Vessel Specs Modal */}
      <AccountManagementModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUserProfile={currentUserProfile}
        currentUserRole={currentUserRole}
        onUpdateUserProfile={(profile) => {
          setCurrentUserProfile(profile);
          saveAndSyncUserProfile(profile);
        }}
        onSelectRole={handleRoleChange}
        onRequestSignOff={() => {
          setIsAccountModalOpen(false);
          setIsSignOffModalOpen(true);
        }}
        onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
        onNavigateToPortal={() => setCurrentTab('portal')}
        onNavigateToTracker={() => setCurrentTab('tracker')}
        jobs={jobs}
        postalOrders={postalOrders}
      />

      {/* Firebase Authentication & 5-Role Governance Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserRole={currentUserRole}
        onSelectRole={handleRoleChange}
        currentUserProfile={currentUserProfile}
        onUpdateUserProfile={(profile) => {
          setCurrentUserProfile(profile);
          saveAndSyncUserProfile(profile);
        }}
        onOpenPermissionsMatrix={() => setIsPermissionsMatrixOpen(true)}
      />

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

      {/* Multi-Environment & Test Data Partitioning Manager Modal */}
      <EnvironmentSettingsModal
        isOpen={isEnvironmentModalOpen}
        onClose={() => setIsEnvironmentModalOpen(false)}
        connectionState={connectionState}
        onDataResetOrImported={handleEnvironmentDataReload}
        onRetryConnection={handleRetryConnection}
      />

      {/* Supplier Purchase Order Reorder Drafting Modal */}
      <SupplierReorderModal
        isOpen={!!supplierReorderItem}
        item={supplierReorderItem}
        onClose={() => setSupplierReorderItem(null)}
        onConfirmRestock={handleRestockItem}
      />

      {/* 5-Role Centralized RBAC Permissions Matrix Modal */}
      <RBACPermissionsModal
        isOpen={isPermissionsMatrixOpen}
        onClose={() => setIsPermissionsMatrixOpen(false)}
        currentUserRole={currentUserRole}
        onSelectRole={handleRoleChange}
        onNavigateToRoute={(route) => {
          setCurrentTab(route);
          setIsPermissionsMatrixOpen(false);
        }}
      />

      {/* RBAC Action Denied Real-time Toast */}
      <RBACActionDeniedToast
        denial={actionDenial}
        onDismiss={() => setActionDenial(null)}
        onSwitchRole={handleRoleChange}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

      {/* Authentication / Sign Off Status Toast */}
      {authToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-sky-500/60 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              authToast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' : 'bg-sky-950/90 border-sky-500/40 text-sky-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold text-white">
                {authToast.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {authToast.message}
              </p>
            </div>

            <button
              onClick={() => setAuthToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
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
