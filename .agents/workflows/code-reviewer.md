---
description: Double check recently written code for bugs, missing fallback values, and broken logical assumptions before proceeding.
---
This workflow acts as an independent Code Review Agent to proactively double check your work, identify stupid mistakes, and prevent deployment errors.

1. Run standard application builds to verify no runtime blockages:
// turbo
2. `npm run lint` (or equivalent) in the respective workspace apps (web / api).
// turbo
3. `npm run build` in the respective workspace to verify compilation works.
4. **Execution History Review**: Review the tasks executed in this session. Analyze the specific typescript files modified to confirm if:
   - Default configurations correctly map to new data structures.
   - Prisma databases are being retrieved and written to safely.
   - Old variables (like removed Dropdowns) weren't accidentally completely scrubbed when they should have remained as fallbacks.
5. **Logic & Impact Grading**: Perform an isolated audit on the modified code. Look specifically for UI/Frontend sync errors with the backend logic.
6. **Report & Fix**: Generate a clear report summarizing any oversights found. Automatically correct the code, implement the structural fixes immediately, and rebuild the app to guarantee it's error-free.
