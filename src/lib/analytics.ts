/**
 * Google Analytics 4 (GA4) Integration Helper
 * Measurement ID: G-3S81J5JS3L
 */

export const GA_MEASUREMENT_ID = 'G-3S81J5JS3L';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Send custom event to Google Analytics
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        send_to: GA_MEASUREMENT_ID,
        ...params
      });
    }
  } catch (err) {
    console.warn('Analytics event dispatch error:', err);
  }
}

/**
 * Track SPA virtual page view on navigation tab changes
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const fullPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
      window.gtag('event', 'page_view', {
        page_path: fullPath,
        page_title: pageTitle || `AJWMES - ${pagePath}`,
        page_location: window.location.origin + fullPath,
        send_to: GA_MEASUREMENT_ID
      });
    }
  } catch (err) {
    console.warn('Analytics page_view dispatch error:', err);
  }
}

/**
 * Track diagnostic or service quote requests (Lead Generation)
 */
export function trackQuoteRequest(data: {
  serviceCategory: string;
  vesselName?: string;
  reference?: string;
  estimatedValue?: number;
}) {
  trackEvent('generate_lead', {
    currency: 'GBP',
    value: data.estimatedValue || 25,
    service_category: data.serviceCategory,
    vessel_name: data.vesselName,
    quote_reference: data.reference
  });
}

/**
 * Track items added to the cart
 */
export function trackAddToCart(item: { id: string; name: string; unitPrice: number }, quantity: number) {
  trackEvent('add_to_cart', {
    currency: 'GBP',
    value: Number((item.unitPrice * quantity).toFixed(2)),
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.unitPrice,
        quantity
      }
    ]
  });
}

/**
 * Track postal order checkout completion (Purchase)
 */
export function trackPurchase(order: {
  orderNumber: string;
  total: number;
  shippingCost?: number;
  items: Array<{ itemId: string; name: string; unitPrice: number; quantity: number }>;
}) {
  trackEvent('purchase', {
    transaction_id: order.orderNumber,
    currency: 'GBP',
    value: order.total,
    shipping: order.shippingCost || 0,
    items: order.items.map(item => ({
      item_id: item.itemId,
      item_name: item.name,
      price: item.unitPrice,
      quantity: item.quantity
    }))
  });
}

/**
 * Track custom panel laser designer interactions
 */
export function trackPanelDesignCustomized(gangCount: number, material: string, estimatedPrice: number) {
  trackEvent('customize_panel', {
    gang_count: gangCount,
    material,
    estimated_price: estimatedPrice
  });
}
