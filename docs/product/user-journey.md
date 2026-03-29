# User Journey

This defines the complete primary user sequence mapping (Happy Path) from an anonymous visitor to a successful sale event.

## 1. Discovery & The Catalog Browser
* **Initiation**: The user lands on the primary Storefront. Edge-cached `Product` grids render instantly without hitting the main backend compute cluster. 
* **Interaction**: The user clicks on a "Solitaire Platinum Ring" utilizing client routing to avoid a full page load.
* **Filtering**: The user selects variant attributes: Size "6", Material "Platinum", Clarity "VVS1".
* **Resolution**: The internal React engine queries TanStack Query to fetch the exact `ProductVariant` entity referencing this specific trait-combination block, resolving an exact retail price immediately.

## 2. Cart Engagement
* **State Sync**: The product is shifted to the Cart State. The frontend posts to exactly match this intent to the backend DB model `CartItem`.
* **Discounts**: The user applies a "SUMMER30" code. The system checks `Discount` relations validating absolute limits and expiration, cutting the total.

## 3. High-Integrity Checkout
* **Checkout Gateway**: The UI transitions the Cart list to an `Order` draft.
* **Atomic Lock**: The user clicks "Confirm Payment." The system instantly requests a transactional DB hold (the `InventoryReservation`) over that specific "Size 6 Platinum Variant", pulling its available count to $0$ to all other customers.
* **Redirection**: User lands directly onto VNPay/PayPal SSL-secured environments. The local tab holds state passively.

## 4. Resolution
* **The Background Ping**: Gateway pings the backend Webhook router blindly confirming exact monetary figures.
* **Webhook Magic**: Backend accepts ping, cryptographically hashes it, drops the active `InventoryReservation`, permanently decreases the `InventoryItem` count, logs the mutation into `InventoryLog`, and promotes the Order structure to `PAID/PROCESSING`.
* **The Return**: Once the UI hits VNPay's Return URL, the backend confirms State Shift via Long-polling and directs the UI definitively to the "Payment Success" modal—completing the Quiet Atelier loop securely.
