# Production Incident Response Playbook (L8+)

## 1. Objectives (RTO / RPO)
- **RTO (Recovery Time Objective)**: < 15 minutes for Tier 1 failures.
- **RPO (Recovery Point Objective)**: < 1 hour (Data loss threshold).

## 2. Severity Classification
- **L1 (Fatal)**: Site down, Payment failing, Data corruption.
- **L2 (Critical)**: Latency > 2s, 5% Error rate, Admin panel inaccessible.
- **L3 (Warning)**: Single non-critical service down, Background job delays.

## 3. Response Loop
1. **Detection**: Alert triggered via PagerDuty/Slack (Phase 3).
2. **Identification**: Use **OpenTelemetry Traces** and **Prometheus metrics** to isolate the layer (DB/Network/Code).
3. **Mitigation**:
    - If code regression: `git tag` rollback via `delivery.yml`.
    - If DB overload: Scale replicas via `hpa.yaml` or manually in Terraform.
    - If security breach: Global Rotate of `JWT_ACCESS_SECRET`.
4. **Resolution**: Root cause analysis and patch.
5. **Feedback**: Update `env-enforcement.yml` with a new test case to prevent recurrence.

## 4. Disaster Recovery (DR) Activation
- **Trigger**: Primary region outage.
- **Action**: Run `terraform apply` in secondary region (Phase 2 IaC) and point DNS to the new LB.
- **Data**: Restore latest snapshot from `backups/` using `backup-dr.ts`.
