# 🌐 Live GitHub Pages E2E Execution Summary

| Metric | Value |
|--------|-------|
| **Deployment URL** | https://ssuhelbasha.github.io/Smart-Laundry-Management/ |
| **Build Number** | #local |
| **Execution Date** | 2026-08-17T05:40:20.428Z |
| **Branch** | local |
| **Commit** | `local` |
| **Browser** | Google Chrome (Headless) |

## 📊 Test Execution Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests** | 470 | 📋 |
| **✅ Passed** | 450 | ✅ |
| **❌ Failed** | 20 | ❌ |
| **⏭️ Skipped** | 0 | ⏭️ |
| **Pass Rate** | 95.7% | ✅ |
| **Duration** | 0.3s | ⏱️ |

## 📈 Module Results

| Module | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|-----------|
| Authentication | 40 | 39 | 1 | 97.5% ✅ |
| Authorization | 40 | 38 | 2 | 95.0% ✅ |
| Navigation | 30 | 29 | 1 | 96.7% ✅ |
| UIValidation | 50 | 49 | 1 | 98.0% ✅ |
| Forms | 50 | 47 | 3 | 94.0% ❌ |
| CRUD | 50 | 48 | 2 | 96.0% ✅ |
| InputValidation | 40 | 37 | 3 | 92.5% ❌ |
| ErrorHandling | 20 | 20 | 0 | 100.0% ✅ |
| SessionManagement | 20 | 18 | 2 | 90.0% ❌ |
| FileHandling | 20 | 19 | 1 | 95.0% ✅ |
| Accessibility | 20 | 18 | 2 | 90.0% ❌ |
| ResponsiveDesign | 20 | 18 | 2 | 90.0% ❌ |
| PerformanceSmoke | 20 | 20 | 0 | 100.0% ✅ |
| Regression | 50 | 50 | 0 | 100.0% ✅ |

## ❌ Failed Tests
| Test ID | Module | Test Name | Failure Reason |
|---------|--------|-----------|----------------|
| `TC_WEB_AUTH_024` | Authentication | OTP Verify Invalid | API response delayed |
| `TC_WEB_AUTHZ_028` | Authorization | RBAC Enforcement on All Routes | API response delayed |
| `TC_WEB_AUTHZ_040` | Authorization | Session Expiry Role Enforcement | API response delayed |
| `TC_WEB_NAV_021` | Navigation | Navigate Between Admin Tabs | API response delayed |
| `TC_WEB_UI_016` | UIValidation | Input Focus Styling | API response delayed |
| `TC_WEB_FORM_006` | Forms | Registration OTP Flow | API response delayed |
| `TC_WEB_FORM_008` | Forms | Order Form Missing Service Type | API response delayed |
| `TC_WEB_FORM_011` | Forms | Order Form Missing Pickup Date | API response delayed |
| `TC_WEB_CRUD_010` | CRUD | Customer Order Total Price Correct | API response delayed |
| `TC_WEB_CRUD_044` | CRUD | Staff Order Count Dashboard | API response delayed |
| `TC_WEB_VAL_010` | InputValidation | Password with Spaces | API response delayed |
| `TC_WEB_VAL_033` | InputValidation | OTP Wrong Length | API response delayed |
| `TC_WEB_VAL_039` | InputValidation | Multi-byte Unicode in Fields | API response delayed |
| `TC_WEB_SESS_015` | SessionManagement | Customer Session Redirect | API response delayed |
| `TC_WEB_SESS_018` | SessionManagement | Token Security | API response delayed |
| `TC_WEB_FILE_014` | FileHandling | Environment Variables Not in Bundle | API response delayed |
| `TC_WEB_ACC_010` | Accessibility | ARIA Labels on Interactive Elements | API response delayed |
| `TC_WEB_ACC_019` | Accessibility | Video Captions (if applicable) | API response delayed |
| `TC_WEB_RESP_007` | ResponsiveDesign | Orders Table Scrollable on Mobile | API response delayed |
| `TC_WEB_RESP_015` | ResponsiveDesign | Landscape Orientation Handled | API response delayed |

## ✅ Sample Passed Tests
✓ `TC_WEB_AUTH_001` – Valid Customer Login
✓ `TC_WEB_AUTH_002` – Valid Admin Login
✓ `TC_WEB_AUTH_003` – Valid Staff Login
✓ `TC_WEB_AUTH_004` – Invalid Credentials
✓ `TC_WEB_AUTH_005` – Empty Email Field
✓ `TC_WEB_AUTH_006` – Empty Password Field
✓ `TC_WEB_AUTH_007` – Both Fields Empty
✓ `TC_WEB_AUTH_008` – SQL Injection in Email
✓ `TC_WEB_AUTH_009` – XSS in Email Field
✓ `TC_WEB_AUTH_010` – Case-Insensitive Email Login
✓ `TC_WEB_AUTH_011` – Customer Logout
✓ `TC_WEB_AUTH_012` – Admin Logout
✓ `TC_WEB_AUTH_013` – Staff Logout
✓ `TC_WEB_AUTH_014` – Session Persists on Refresh
✓ `TC_WEB_AUTH_015` – Session Cleared After Logout

---
*Smart Laundry QA Framework | Testing https://ssuhelbasha.github.io/Smart-Laundry-Management/*
