# Portfolio Management & Tax Reports — Backend + Dynamic Frontend

## Goal
Add full backend APIs for **Portfolio Management** and **Tax Reports** with CRUD operations, Indian tax computation (FY 2025-26), and PDF report generation. Replace sample data on frontend with dynamic user input.

---

## Proposed Changes

### Domain Layer — `FinancialApplication.Domain`

#### [NEW] `Domain/Entity/PortfolioAsset.cs`
```
PortfolioAssetId (Guid, PK)
UserId (Guid, FK → Users)
Name (string, 200)        — e.g. "Nifty 50 Index Fund"
AssetType (string, 50)    — Equity, Mutual Fund, Gold, Fixed Income, International, Crypto
InvestedAmount (decimal)
CurrentValue (decimal)
AllocationPercentage (decimal, nullable) — auto-calculated
Color (string, 10)        — hex color for UI
Notes (string, 500, nullable)
PurchaseDate (DateTime)
CreatedAt, UpdatedAt
```

#### [NEW] `Domain/Entity/TaxEntry.cs`
```
TaxEntryId (Guid, PK)
UserId (Guid, FK → Users)
FinancialYear (string, 10) — e.g. "2025-26"
Category (string, 100)     — e.g. "Salary", "Section 80C"
Description (string, 500)
Amount (decimal)
EntryType (string, 20)     — "income" | "deduction" | "capital_gain"
Section (string, 20, nullable) — e.g. "80C", "80D", "10(14)"
CreatedAt, UpdatedAt
```

---

### Application Layer — DTOs & Interfaces

#### [NEW] `DTOs/Portfolio/PortfolioDtos.cs`
- `CreatePortfolioAssetDto`, `UpdatePortfolioAssetDto`, `PortfolioAssetDto`
- `PortfolioSummaryDto` (totals, returns, allocation breakdown)

#### [NEW] `DTOs/Tax/TaxDtos.cs`
- `CreateTaxEntryDto`, `UpdateTaxEntryDto`, `TaxEntryDto`
- `TaxComputationDto` — full tax breakdown with both regimes
- `TaxComputationDto` includes:
  - Gross income, capital gains, total deductions
  - Old regime: slabs, rebate 87A, surcharge, cess, total tax
  - New regime: slabs, rebate 87A, surcharge, cess, total tax
  - Recommended regime

#### [NEW] `Interfaces/IPortfolioService.cs`
- `CreateAsync`, `GetAllAsync`, `GetByIdAsync`, `UpdateAsync`, `DeleteAsync`, `GetSummaryAsync`

#### [NEW] `Interfaces/ITaxReportService.cs`
- `CreateAsync`, `GetAllAsync`, `UpdateAsync`, `DeleteAsync`
- `ComputeTaxAsync(userId, fy)` — compute tax under both regimes
- `GenerateReportAsync(userId, fy)` — returns PDF bytes

---

### Infrastructure Layer — Service + DbContext

#### [MODIFY] `Data/AppDbContext.cs`
- Add `DbSet<PortfolioAsset>` and `DbSet<TaxEntry>`
- Add entity configs (table names, indexes on UserId + FY)

#### [NEW] `Services/PortfolioService.cs`
- Standard CRUD with auto-calculated allocation percentages

#### [NEW] `Services/TaxReportService.cs`
- CRUD for tax entries
- **Indian Tax Computation (FY 2025-26)**:

##### New Regime Slabs (default)
| Taxable Income | Rate |
|---|---|
| Up to ₹3,00,000 | Nil |
| ₹3,00,001 – ₹7,00,000 | 5% |
| ₹7,00,001 – ₹10,00,000 | 10% |
| ₹10,00,001 – ₹12,00,000 | 15% |
| ₹12,00,001 – ₹15,00,000 | 20% |
| Above ₹15,00,000 | 30% |
- Standard deduction: ₹75,000
- Rebate u/s 87A: Full rebate if taxable income ≤ ₹7,00,000

##### Old Regime Slabs
| Taxable Income | Rate |
|---|---|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |
- Standard deduction: ₹50,000
- Rebate u/s 87A: ₹12,500 if taxable income ≤ ₹5,00,000
- All 80C/80D/HRA deductions apply

##### Capital Gains (from July 2024)
- STCG on equity: 20%
- LTCG on equity: 12.5% (above ₹1.25L exemption)

##### Surcharge & Cess
- 4% Health & Education Cess on total tax + surcharge
- Surcharge slabs based on income

---

### API Layer — Controllers

#### [NEW] `Controllers/PortfolioController.cs`
- `[RequireFeature("portfolio_management")]`
- POST, GET, GET/{id}, PUT/{id}, DELETE/{id}, GET/summary

#### [NEW] `Controllers/TaxReportController.cs`
- `[RequireFeature("tax_reports")]`
- POST, GET, PUT/{id}, DELETE/{id}
- GET/compute?fy=2025-26 — returns full tax computation
- GET/report?fy=2025-26 — returns PDF download

---

### Frontend (D: drive)

#### [MODIFY] `pages/finance/PortfolioManagement.tsx`
- Replace sample data with API calls to `/api/portfolio`
- Add/Edit/Delete modals for portfolio assets
- Real-time allocation calculation
- Summary cards from `/api/portfolio/summary`

#### [MODIFY] `pages/finance/TaxReports.tsx`
- Replace sample data with API calls to `/api/tax`
- Add/Edit/Delete modals for income, deductions, capital gains
- Tax computation from `/api/tax/compute?fy=2025-26`
- Side-by-side Old vs New regime comparison
- "Download Report" → `/api/tax/report?fy=2025-26` (PDF)

---

### DI Registration

#### [MODIFY] `Program.cs`
```csharp
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddScoped<ITaxReportService, TaxReportService>();
```

---

## Verification Plan

### Build
- `dotnet build` — 0 errors
- `npx tsc --noEmit` on D: drive — 0 errors

### Migration
- `dotnet ef migrations add AddPortfolioAndTaxEntities`
- `dotnet ef database update`

### Manual Testing
- CRUD portfolio assets via API
- CRUD tax entries via API
- Tax computation returns correct values for sample data
- PDF download works
- Frontend pages work end-to-end
