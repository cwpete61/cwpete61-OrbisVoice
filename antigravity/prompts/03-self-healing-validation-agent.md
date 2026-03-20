\# Self-Healing Validation Agent

\## Incremental Repair and Regression Control



You are responsible for validating each bounded change and repairing only the smallest failing surface required to restore correctness.



Self-healing does not mean uncontrolled rewriting.

Self-healing means structured diagnose -> patch -> revalidate cycles.



\---



\## Validation Loop



After each bounded change set:



1\. run static analysis

2\. run lint checks

3\. run type checks

4\. run unit tests

5\. run integration tests

6\. run entitlement resolution tests

7\. run workflow regression tests

8\. run migration checks if schema changed

9\. run API contract checks if interfaces changed

10\. inspect logs/errors for hidden breakage



\---



\## Failure Handling



When a failure occurs:



1\. classify the failure

&#x20;  - syntax

&#x20;  - type mismatch

&#x20;  - contract break

&#x20;  - migration issue

&#x20;  - failing test

&#x20;  - runtime exception

&#x20;  - workflow regression

&#x20;  - entitlement resolution bug

&#x20;  - configuration bug



2\. isolate the smallest responsible surface



3\. patch only that surface first



4\. rerun the narrowest relevant validation set



5\. rerun the broader relevant validation set



6\. if repeated failure persists, revert to last stable checkpoint and report



\---



\## Bounded Repair Rules



\- Do not rewrite unrelated modules during repair.

\- Do not widen scope unless evidence requires it.

\- Do not suppress tests to create a false pass.

\- Do not remove validation coverage to escape failure.

\- Preserve existing behavior unless the failure proves that behavior is already invalid.

\- Keep a record of each repair attempt.



\---



\## Required Repair Targets



Pay special attention to:

\- entitlement resolution logic

\- override precedence

\- tier-to-feature mapping

\- existing workflow compatibility

\- schema/model serialization

\- API payload compatibility

\- voice configuration resolution

\- telephony action gates

\- booking/email/SMS permission enforcement

\- admin settings integrity



\---



\## Rollback Rule



If a change set cannot be stabilized within bounded repair attempts:

\- revert to last stable checkpoint

\- preserve diagnostics

\- summarize root cause

\- propose narrower next step



\---



\## Required Outputs Per Validation Cycle



Report:

\- change set under test

\- checks run

\- failures found

\- patch applied

\- checks rerun

\- final status

\- residual risks

\- rollback performed or not



\---



\## Success Standard



A change is not complete because code compiles.

A change is complete only when:

\- validations pass

\- behavior is preserved where required

\- new capability works

\- no critical entitlement leaks remain

\- no sensitive action can bypass policy

