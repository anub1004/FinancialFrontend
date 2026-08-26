# Sprint 1 — Core Financial Features

## Entity Enhancements
- [ ] Enhance `Transaction` entity (add Currency, PaymentMethod, IsRecurring, UpdatedAt)
- [ ] Enhance `Investment` entity (add Name, CurrentValue, Returns, ReturnPercentage, Notes, Currency)
- [ ] Enhance `Goal` entity (add Description, Icon, Color)
- [ ] Update `AppDbContext` configurations for new fields

## Transaction System
- [ ] Create Transaction DTOs (Create, Update, Response, Summary, Filter)
- [ ] Create `ITransactionService` interface
- [ ] Create `TransactionService` implementation
- [ ] Create `TransactionController` with full CRUD + summary + categories

## Investment System
- [ ] Create Investment DTOs (Create, Update, Response, Summary)
- [ ] Create `IInvestmentService` interface
- [ ] Create `InvestmentService` implementation
- [ ] Create `InvestmentController` with full CRUD + portfolio summary

## Goals System
- [ ] Create Goal DTOs (Create, Update, Response, Contribution)
- [ ] Create `IGoalService` interface
- [ ] Create `GoalService` implementation
- [ ] Create `GoalController` with full CRUD + contribute + status

## Dashboard
- [ ] Create Dashboard DTOs (Summary, MonthlyTrend, CategoryBreakdown, RecentActivity)
- [ ] Create `IDashboardService` interface
- [ ] Create `DashboardService` implementation
- [ ] Create `DashboardController`

## Wiring
- [ ] Register all new services in `Program.cs`
- [ ] Create EF Core migration for entity changes
- [ ] Build and verify

## Frontend
- [ ] Address frontend access (outside workspace)
