# Overview - Vault & Inventory Management

The **Vault & Inventory** module is a core logistics and asset management system designed for **Ray Paradis**, a premium high-end jewelry e-commerce platform. Because jewelry assets contain high-value precious stones and metals, this module provides rigorous safety mechanisms, real-time auditing, and chip-level RFID tracking.

## Core Pillars

The system is architected around five major concepts:

1. **Vault & Location Management:**
   Hierarchical storage categorization: *Branch -> Warehouse/Vault -> Zone -> Safe/Tray*. Supports maximum security levels and insurance caps per location.
   
2. **Dual-Inventory Mode:**
   - **Quantity-Based Balances:** Used for packaging boxes, certificates, and accessories.
   - **Serialized Asset Tracking:** Each high-value jewelry piece has a unique Serial Number and optional **RFID Tag** to track its lifecycle.
   
3. **Double-Entry Stock Transfers:**
   A secure workflow ensuring zero slippage of transiting assets. Handled through explicit approval states and physical RFID scanning at both origins and destinations.

4. **Blind Stocktaking:**
   Enables warehouse staff to perform physical scans without previewing system quantities, ensuring unbiased and honest auditing.
   
5. **Security & Financial Sanity:**
   Strict logging of all inventory fluctuations, separate security audit trail for user operations, and proper classification of discrepancies (`LOST`, `MISSING`, `FOUND`, `WRITTEN_OFF`) instead of inflating sales reports with missing items.

## Key Terminology

- **InventoryBalance:** Represents the accumulated stock level (`quantity`, `reservedQuantity`, `damagedQuantity`) of a specific variant in a given warehouse.
- **PhysicalItem:** Represents an individual, serialized physical piece of jewelry, potentially equipped with an RFID tag.
- **StockTransfer:** Regulates the flow of items shifting between showrooms and central safes.
- **StocktakeSession:** A process where physical counts are conducted, matching RFID scanned data against systemic balances.

## User Roles & Permissions

- **Warehouse Staff (`inventory:read`, `inventory:transfer:create`, `inventory:audit:create`):**
  Performs daily operations, triggers stock transfers, and conducts physical counts.
- **Store Manager (`inventory:transfer:approve`, `inventory:transfer:reject`, `inventory:audit:submit`):**
  Approves or rejects incoming transfer requests and submits stocktake results.
- **CFO & Operations Admin (`inventory:admin`, `inventory:audit:resolve`):**
  Configures insurance limits, locks/unlocks vault zones, and resolves inventory discrepancies.
