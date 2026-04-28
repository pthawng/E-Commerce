import { Order } from "./types";

export const MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    orderNumber: "RP-2024-001",
    customerId: "c1",
    customerName: "Eleanor Thorne",
    status: "pending",
    paymentStatus: "unpaid",
    items: [
      {
        id: "oi1",
        productId: "p1",
        variantId: "v1",
        productName: "Elysian Diamond Halo Ring",
        variantDescription: "18k White Gold / 1.5ct Diamond / Size 6",
        unitPrice: 4500,
        quantity: 1,
        totalPrice: 4500,
      },
    ],
    totals: {
      subtotal: 4500,
      shipping: 50,
      tax: 450,
      discount: 0,
      total: 5000,
      currency: "USD",
    },
    shippingAddress: {
      fullName: "Eleanor Thorne",
      phone: "+1 (555) 012-3456",
      line1: "742 Luxury Lane",
      city: "Beverly Hills",
      state: "CA",
      country: "USA",
      postalCode: "90210",
    },
    billingAddress: {
      fullName: "Eleanor Thorne",
      phone: "+1 (555) 012-3456",
      line1: "742 Luxury Lane",
      city: "Beverly Hills",
      state: "CA",
      country: "USA",
      postalCode: "90210",
    },
    paymentMethod: "paypal",
    timeline: [
      {
        id: "t1",
        status: "pending",
        description: "Order created by customer",
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
