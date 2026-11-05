# DISCLOSEGUARD — Studio acceptance and reviewer guide

**Network:** GenLayer Studionet 61999. **Contract class:** `DiscloseGuard` in `contracts/discloseguard.py`. Assign at least three wallets: Chair, Reviewer A and Reviewer B. Record the actual contract address, signed tx hashes and final-state readbacks in the technical verification log.

## Create the review case

Chair calls `create_review(title, subject_details, conflict_rules)`:

- Title: `Grant Round Alpha reviewer eligibility`
- Subject: `Grant Round Alpha will assess funding for Project Cedar, which develops an open-source data indexing tool. Reviewers must disclose direct financial and advisory ties to this applicant.`
- Rules: `A reviewer must recuse if they are a paid adviser, employee, founder, direct owner, or active contractor of Project Cedar. A reviewer must provide a specific statement addressing these ties and provide a supporting disclosure reference. Unclear relationships or incomplete disclosures must be escalated for manual review.`

Read `get_review(id)`, verify chair and `rules_version: 1`. Chair calls `assign_reviewer(id, ReviewerA)` and `assign_reviewer(id, ReviewerB)`.

## Three independent outcomes

**A — Conflict / expected RECUSE.** Reviewer A calls `submit_disclosure` with:

- Relationship: `I served as a paid adviser to Project Cedar during this current grant round, providing regular strategy and product advice under a consulting engagement.`
- Evidence reference: `Self-declared advisory engagement / test record A`

Chair calls `assess_conflict(id, ReviewerA)` and checks `get_assessment` plus `authorization`. Under the stated rules the expected judgment is `RECUSE` and `allowed=false`. A Reviewer A attempt at `submit_review` should roll back.

**B — Eligible / expected ELIGIBLE.** Reviewer B calls `submit_disclosure` with:

- Relationship: `I have never been employed, paid, contracted, or given equity by Project Cedar, its founders or current advisers, and have no professional relationship with the applicant.`
- Evidence reference: `Self-declared conflict statement / test record B`

Chair assesses Reviewer B. For a finalized `ELIGIBLE` decision verify `authorization.allowed=true`. Reviewer B submits a 60+ character review text plus its **exact lowercase SHA-256** using `submit_review`. Confirm the on-chain receipt `SIGNED_REVIEW_SUBMITTED` and one-time limit.

**C — Missing or unclear / expected REVIEW_REQUIRED.** Use a separately assigned Reviewer C and a materially ambiguous relationship, such as `We worked together at some point; I cannot clarify whether any compensation or ownership connection still exists.` Record the actual validator result. The `REVIEW_REQUIRED` path does not authorize submission.

## Invalidation and historical integrity

Run a new review or use an eligible reviewer before receipt submission. Reviewer revises the disclosure → old authorization becomes false until new AI assessment. Chair calls `update_rules` → old eligibility invalidates for all not-yet-submitted reviews. Chair calls `revoke_reviewer` → reviewer cannot submit. Confirm previously created receipt remains readable by `receipt_for`.

## Evidence checklist

Capture the deployed contract address/source, signer wallets, exact method arguments, TX hash, GenVM `SUCCESS` or expected rollback, validator consensus, `get_assessment`, `authorization` and `receipt_for` readbacks at LATEST_FINAL. Do not conflate a `FINALIZED` transaction with successful execution. The output is an access-control decision based on self-disclosed evidence, not a real-world independent background check.