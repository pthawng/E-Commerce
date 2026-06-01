# API Reference - Vault & Inventory

All requests must include an authorization Bearer token and are subject to Role-Based Access Control (RBAC) validation.

---

### Get Overview Metrics
Returns aggregate statistics of inventory value, insurance caps, and tag statuses.

- **Method & Path:** `GET /api/back-office/inventory/overview`
- **Permission required:** `inventory:read`
- **Response Example:**
```json
{
  "success": true,
  "data": {
    "totalInsuranceValue": 156000000.00,
    "rfidTaggedPercentage": 98.4,
    "inTransitCount": 12,
    "discrepancyCount": 2,
    "inventoryHealth": { "healthy": 85, "lowStock": 10, "deadStock": 5 }
  }
}
```

---

### Create Stock Transfer
Initiates a transfer workflow for a list of items.

- **Method & Path:** `POST /api/back-office/inventory/transfers`
- **Permission required:** `inventory:transfer:create`
- **Request Body:**
```json
{
  "fromWarehouseId": "uuid-111",
  "toWarehouseId": "uuid-222",
  "note": "Exhibition shipment",
  "items": [
    {
      "productVariantId": "uuid-var-1",
      "physicalItemId": "uuid-phys-1",
      "quantity": 1
    }
  ]
}
```
- **Response:** The created `StockTransfer` object with status `PENDING`.

---

### Approve Stock Transfer
Manager approves the requested shipment.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/approve`
- **Permission required:** `inventory:transfer:approve`
- **Response:** Updates transfer status to `APPROVED`.

---

### Reject Stock Transfer
Manager rejects the requested shipment.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/reject`
- **Permission required:** `inventory:transfer:reject`
- **Request Body:**
```json
{
  "reason": "Destination showroom has reached its insurance limit threshold."
}
```
- **Response:** Updates transfer status to `REJECTED`.

---

### Ship Stock Transfer
Scans physical RFID tags to register items giao đi (transit).

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/ship`
- **Permission required:** `inventory:transfer:ship`
- **Request Body:**
```json
{
  "scannedRfidTags": ["RFID-10023912", "RFID-10023913"]
}
```
- **Response:** Status transitioned to `SHIPPED`.

---

### Receive Stock Transfer
Confirm reception of shipped items using RFID matching.

- **Method & Path:** `PATCH /api/back-office/inventory/transfers/:id/receive`
- **Permission required:** `inventory:transfer:receive`
- **Request Body:**
```json
{
  "scannedRfidTags": ["RFID-10023912", "RFID-10023913"]
}
```
- **Response:** Status transitioned to `COMPLETED`.

---

### Resolve Discrepancy
Resolves an unmatched stock item after a stocktake.

- **Method & Path:** `POST /api/back-office/inventory/discrepancies/:id/resolve`
- **Permission required:** `inventory:audit:resolve` (Requires CFO/Admin role)
- **Request Body:**
```json
{
  "action": "DEDUCT_LOSS",
  "targetStatus": "LOST", // LOST, MISSING, WRITTEN_OFF (Avoid using SOLD)
  "note": "Deduct sample piece lost during exhibition."
}
```
- **Response:** Resolution applied.
