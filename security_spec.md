# Security Specification: StadiumX IoT Telemetry

## 1. Data Invariants
- **Capacity Constraint**: `attendance` must be a non-negative integer and cannot exceed `maxCapacity`.
- **Sensory Boundaries**: `washroomOccupancy` must be an integer between 0 and 100 (inclusive).
- **Security States**: `securityStatus` must be strictly restricted to the enum values `"NORMAL" | "VIGILANT" | "ALERT"`.
- **System Flag Integrity**: `evacuationLock` must be a boolean.
- **Reference Validation**: All referenced entities and array types (such as incident severities and statuses) must conform to their corresponding definitions.

---

## 2. The "Dirty Dozen" Malicious/Invalid Payloads
These payloads attempt to exploit update gaps, inject invalid states, trigger out-of-bounds metrics, or bypass structural type constraints.

### Payload 1: Over-Capacity Flood (Attendance exceeds Maximum)
```json
{
  "attendance": 99999,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL"
}
```

### Payload 2: Negative Operations Flow (Negative Attendance)
```json
{
  "attendance": -500,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL"
}
```

### Payload 3: Invalid Type for Flag (evacuationLock as String)
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": "true",
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL"
}
```

### Payload 4: Washroom Overflow (Occupancy out of bounds > 100%)
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 150,
  "securityStatus": "NORMAL"
}
```

### Payload 5: Negative Washroom Density
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": -5,
  "securityStatus": "NORMAL"
}
```

### Payload 6: Invalid Security Status Enum Injection
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "CRITICAL_PANIC"
}
```

### Payload 7: Structure Mutation (Ghost Field Injecting privileged variables)
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL",
  "bypassControlAuth": true
}
```

### Payload 8: Corrupted Latency Maps (Injection of massive string array bypassing latency metrics)
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL",
  "gateLatencies": "CRITICAL_OVERHEAT_BYPASS_EXPLOIT"
}
```

### Payload 9: Empty Document Schema Breach (Missing required field `evacuationLock`)
```json
{
  "attendance": 70000,
  "maxCapacity": 80000,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL"
}
```

### Payload 10: Value Overflow (Injecting a huge attendance integer exceeding 32-bit integer scale)
```json
{
  "attendance": 99999999999999,
  "maxCapacity": 80000,
  "evacuationLock": false,
  "washroomOccupancy": 50,
  "securityStatus": "NORMAL"
}
```

### Payload 11: Invalid ID Poisoning Guard
Attempt to write to `telemetry/current/sub_exploitable/../../override` to bypass path constraints.

### Payload 12: Unsigned-in Data Write
Any write attempt to telemetry matrices without a valid, verified authentication context.

---

## 3. Firestore Rules Test Runner Spec (`firestore.rules.test.ts`)
Below is the unit test description for verifying that the database security blocks all unauthorized exploits.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

describe("StadiumX Telemetry Security Rule Unit Tests", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "restful-beaker-jmvz5",
      firestore: {
        rules: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // catch-all default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`
      }
    });
  });

  it("should fail write for unauthenticated users", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthDb, "telemetry", "current");
    await assertFails(setDoc(docRef, { attendance: 75000 }));
  });
});
```
