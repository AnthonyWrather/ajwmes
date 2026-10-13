import { PostalOrder, PostalOrderStatus, PostalOrderTimelineEvent } from '../types';

export interface ProgressStep {
  key: 'received' | 'packed' | 'dispatched' | 'delivered';
  stepNumber: number;
  label: string;
  sublabel: string;
  description: string;
  timestamp?: string;
  status: 'completed' | 'current' | 'upcoming';
  iconType: 'receipt' | 'package' | 'truck' | 'check';
  badge: string;
  badgeColor: string;
}

/**
 * Maps any raw PostalOrderStatus to an indexed progress tier (0 to 3)
 * 0 = Received/Pending
 * 1 = Processing/Packed
 * 2 = Dispatched/Ready for Pickup
 * 3 = Delivered
 */
export function getStatusTier(status: PostalOrderStatus): number {
  switch (status) {
    case 'pending':
    case 'received':
      return 0;
    case 'processing':
    case 'packed':
      return 1;
    case 'ready_for_pickup':
    case 'dispatched':
      return 2;
    case 'delivered':
      return 3;
    default:
      return 0;
  }
}

/**
 * Returns overall percentage progress: 25%, 50%, 75%, 100%
 */
export function getOrderProgressPercent(order: PostalOrder): number {
  const tier = getStatusTier(order.orderStatus);
  switch (tier) {
    case 0:
      return 25;
    case 1:
      return 50;
    case 2:
      return 75;
    case 3:
      return 100;
    default:
      return 25;
  }
}

/**
 * Generates the 4 standardized steps for the visual progress timeline
 */
export function buildOrderTimelineSteps(order: PostalOrder): ProgressStep[] {
  const currentTier = getStatusTier(order.orderStatus);
  const isPickup = order.shippingMethod === 'solent_pickup' || order.orderStatus === 'ready_for_pickup';
  const carrierName = order.trackingCarrier || (order.shippingMethod === 'dpd_heavy' ? 'DPD Freight' : 'Royal Mail Tracked 24');

  // Estimate dates if not explicitly recorded
  const receiptTime = order.createdAt;
  const packedTime = order.packedAt || (currentTier >= 1 ? `${order.createdAt.split(' ')[0]} (Bench Complete)` : undefined);
  const dispatchedTime = order.dispatchedAt || (currentTier >= 2 ? `${order.createdAt.split(' ')[0]} (Transit Active)` : undefined);
  const deliveredTime = order.deliveredAt || (currentTier >= 3 ? 'Delivered' : undefined);

  const destinationLabel = order.shippingAddress.isMarinaDelivery
    ? `${order.shippingAddress.marinaName || 'Solent Marina'} (${order.shippingAddress.berthNumber || 'Berth Pontoon'})`
    : `${order.shippingAddress.city}, ${order.shippingAddress.postcode}`;

  return [
    {
      key: 'received',
      stepNumber: 1,
      label: 'Order Received',
      sublabel: 'Payment Verified & Queued',
      description: `Order placed online. Payment confirmed via ${order.paymentMethod === 'card' ? 'Stripe Card' : 'Bank Transfer'}. Marine tinned cables & hardware allocated from Gosport stock.`,
      timestamp: receiptTime,
      status: currentTier > 0 ? 'completed' : currentTier === 0 ? 'current' : 'upcoming',
      iconType: 'receipt',
      badge: currentTier > 0 ? 'Verified' : 'In Workshop Queue',
      badgeColor: currentTier > 0 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-amber-400 bg-amber-950/60 border-amber-500/30'
    },
    {
      key: 'packed',
      stepNumber: 2,
      label: isPickup ? 'Bench Prepared' : 'Bench Cut & Packed',
      sublabel: 'Custom Cable QA & Weatherproof Seal',
      description: isPickup 
        ? 'Continuous tinned wire measured, terminals crimped, bagged & labeled for Solent workshop collection.'
        : `Continuous cable run cut from master spools. Crimp integrity checked, waterproof barrier sealed, packing slip #${order.orderNumber} enclosed.`,
      timestamp: packedTime,
      status: currentTier > 1 ? 'completed' : currentTier === 1 ? 'current' : 'upcoming',
      iconType: 'package',
      badge: currentTier > 1 ? 'Pack Complete' : currentTier === 1 ? 'On Workshop Bench' : 'Awaiting Bench',
      badgeColor: currentTier > 1 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : currentTier === 1 ? 'text-sky-400 bg-sky-950/60 border-sky-500/30' : 'text-slate-500 bg-slate-900 border-slate-800'
    },
    {
      key: 'dispatched',
      stepNumber: 3,
      label: isPickup ? 'Ready for Collection' : 'Dispatched in Transit',
      sublabel: isPickup ? 'Gosport Workshop Desk' : carrierName,
      description: isPickup
        ? 'Consignment ready at Gosport workshop or Haslar drop locker for skipper pickup.'
        : `Handed over to ${carrierName}.${order.trackingNumber ? ` Tracking Reference: ${order.trackingNumber}.` : ''} Outbound across Solent / UK postal network.`,
      timestamp: dispatchedTime,
      status: currentTier > 2 ? 'completed' : currentTier === 2 ? 'current' : 'upcoming',
      iconType: 'truck',
      badge: currentTier > 2 ? 'Dispatched' : currentTier === 2 ? 'In Transit' : 'Pending Courier',
      badgeColor: currentTier > 2 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : currentTier === 2 ? 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30' : 'text-slate-500 bg-slate-900 border-slate-800'
    },
    {
      key: 'delivered',
      stepNumber: 4,
      label: isPickup ? 'Collected by Skipper' : 'Delivered on Vessel',
      sublabel: destinationLabel,
      description: isPickup
        ? `Collected and signed out at Gosport Marina counter by vessel crew.`
        : `Consignment delivered to ${destinationLabel}. Electrical supplies safely on board.`,
      timestamp: deliveredTime,
      status: currentTier === 3 ? 'completed' : 'upcoming',
      iconType: 'check',
      badge: currentTier === 3 ? 'Delivered' : 'Pending Delivery',
      badgeColor: currentTier === 3 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-slate-500 bg-slate-900 border-slate-800'
    }
  ];
}

/**
 * Builds chronological historical event entries from receipt to delivery
 */
export function buildOrderTimelineHistory(order: PostalOrder): PostalOrderTimelineEvent[] {
  // If order already has stored custom timeline events, use them as base
  const existingEvents = order.timeline || [];
  const currentTier = getStatusTier(order.orderStatus);
  const isPickup = order.shippingMethod === 'solent_pickup' || order.orderStatus === 'ready_for_pickup';
  const carrierName = order.trackingCarrier || (order.shippingMethod === 'dpd_heavy' ? 'DPD Express' : 'Royal Mail Tracked 24');

  const destinationLabel = order.shippingAddress.isMarinaDelivery
    ? `${order.shippingAddress.marinaName || 'Marina'} (${order.shippingAddress.berthNumber || 'Berth Pontoon'})`
    : `${order.shippingAddress.city}, ${order.shippingAddress.postcode}`;

  const defaultEvents: PostalOrderTimelineEvent[] = [
    {
      id: `evt-${order.id}-1`,
      status: 'received',
      title: 'Order Placed & Payment Authorized',
      description: `Payment of £${order.total.toFixed(2)} received via ${order.paymentMethod.toUpperCase()}. Order confirmed with ${order.items.length} items.`,
      timestamp: order.createdAt,
      location: 'Gosport Workshop Web Store',
      completed: true,
      operator: 'Online Checkout System'
    }
  ];

  if (currentTier >= 1) {
    defaultEvents.push({
      id: `evt-${order.id}-2`,
      status: 'packed',
      title: isPickup ? 'Cable Run Measured & Bagged' : 'Cables Cut, Terminals Inspected & Parcel Packed',
      description: `Bench technician prepared continuous marine tinned cable runs and fuse accessories. Enclosed formal packing slip for order ${order.orderNumber}.`,
      timestamp: order.packedAt || `${order.createdAt.split(' ')[0]} 12:30`,
      location: 'Gosport Electrical Workshop Bench',
      completed: true,
      operator: 'Anthony Wrather (Solent Lead)'
    });
  }

  if (currentTier >= 2) {
    defaultEvents.push({
      id: `evt-${order.id}-3`,
      status: 'dispatched',
      title: isPickup ? 'Ready at Gosport Workshop Pickup Counter' : `Handed to ${carrierName}`,
      description: isPickup
        ? 'Stored on collection shelf with vessel reference card.'
        : `Consignment accepted into postal courier hub. Outbound delivery to ${destinationLabel}.`,
      timestamp: order.dispatchedAt || `${order.createdAt.split(' ')[0]} 16:15`,
      location: isPickup ? 'Gosport Workshop Bench 1' : 'Gosport Royal Mail Delivery Office',
      carrier: carrierName,
      trackingNumber: order.trackingNumber,
      completed: true,
      operator: isPickup ? 'AJWMES Workshop Desk' : carrierName
    });
  }

  if (currentTier >= 3) {
    defaultEvents.push({
      id: `evt-${order.id}-4`,
      status: 'delivered',
      title: isPickup ? 'Handed Over to Vessel Crew' : 'Final Delivery Confirmed on Vessel',
      description: isPickup
        ? `Consignment handed to ${order.customerName}. Checked off against packing slip.`
        : `Package delivered to ${destinationLabel}. Left safely according to delivery notes: "${order.shippingAddress.deliveryNotes || 'Direct to berth pontoon'}".`,
      timestamp: order.deliveredAt || `${order.createdAt.split(' ')[0]} Next Day 11:20`,
      location: destinationLabel,
      completed: true,
      operator: 'Local Postal Courier / Pontoon Officer'
    });
  }

  // Merge any custom stored events with default events without duplicating
  const merged = [...defaultEvents];
  for (const customEvt of existingEvents) {
    if (!merged.some(e => e.id === customEvt.id)) {
      merged.push(customEvt);
    }
  }

  // Sort chronologically by timestamp
  return merged.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
}
