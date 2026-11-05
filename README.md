# DISCLOSEGUARD

**Conflict-of-interest decisions that actually control reviewer access.**

DISCLOSEGUARD is a standalone **GenLayer Intelligent Contract** for funding committees, DAO review boards, grant programs and governance processes that need to assign reviewers, interpret self-declared relationships and protect the integrity of signed reviews.

## Product workflow

1. A **chair** opens a review case and locks the subject and conflict rules.
2. The chair assigns distinct **reviewer wallets**.
3. Each reviewer submits a **signed disclosure** and a supporting reference.
4. GenLayer comparative AI evaluation yields **`ELIGIBLE`, `RECUSE`, or `REVIEW_REQUIRED`** from the locked rules and disclosure.
5. Only a reviewer with a currently valid `ELIGIBLE` decision may **submit one signed, hash-linked review**. The recorded receipt preserves the reviewer, exact evidence versions and submitted content.

### What makes it useful

An LLM verdict alone is not an access control system. DISCLOSEGUARD binds the AI decision to **assignment version + disclosure version + rules version + disclosure hash**. Updating a declaration, revoking an assignment or changing the conflict rulebook invalidates old authorizations immediately. A reviewer cannot bypass the gate by sending a second review or reusing another wallet's disclosure.

### Illustrative decisions

| Disclosure | Expected AI interpretation | On-chain permission |
| --- | --- | --- |
| A reviewer discloses paid advisory work for the applicant under a no-paid-relationships policy | `RECUSE` | Deny submission |
| A reviewer declares no relevant relationship and provides the requested scope of disclosure | `ELIGIBLE` | Permit one signed review |
| Relationship is unclear or material details are omitted | `REVIEW_REQUIRED` | Deny until reassessed |

These are **sample expectations** for a Studio test. Only signed executions and latest-final reads establish actual GenLayer outcomes. Reviewers' self-reports are not independent certifications of identity or truthfulness.

## Contract interface

| Method | Product effect |
| --- | --- |
| `create_review` | Opens chair-owned subject and conflict rulebook |
| `assign_reviewer` | Creates versioned wallet-bound assignment |
| `submit_disclosure` | Records signed reviewer declaration and evidence hash |
| `assess_conflict` | AI consensus independently evaluates stated conflict criteria |
| `authorization` | Publicly reads current reviewer eligibility |
| `submit_review` | Writes one signed review plus immutable receipt |
| `update_rules` | Advances policy version and invalidates older eligibility |
| `revoke_reviewer` | Immediately disables future permissions |
| `close_review` | Ends further reviewer submissions |

Additional views: `get_review`, `get_assignment`, `get_disclosure`, `get_assessment`, `receipt_for`, `get_receipt`, `stats`. The product keeps a completed review receipt accessible after later changes in rules or assignment status.

## Deployed GenLayer contract

DISCLOSEGUARD is deployed on **GenLayer Studionet 61999** at [`0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981`](https://explorer-studio.genlayer.com/address/0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981). The [read-only deployment preflight](https://github.com/bearbaba/DISCLOSEGUARD/actions/runs/42039328637) verified the deployed source matches this repository, all 16 contract methods are present and `stats()` is readable at `LATEST_FINAL`. Initial state: `0 reviews / 0 receipts`. The [signed on-chain acceptance evidence](docs/ONCHAIN_EVIDENCE.md) now demonstrates all three actual GenLayer verdicts (**RECUSE, REVIEW_REQUIRED and ELIGIBLE**), RECUSE denial, disclosure-version reassessment, a successful one-time signed review with Receipt #1, and an expected duplicate-submission rollback. The latest [read-only state verification](https://github.com/bearbaba/DISCLOSEGUARD/actions/runs/42048408930) verified the persisted receipt and post-submit authorization lock (prior to the duplicate transaction).

**Scope of the proof:** these are Studionet executions using synthetic self-declarations, not independently verified real-world conflicts. A successful GenLayer consensus result is not factual background verification.

[Import in GenLayer Studio](https://studio.genlayer.com/?import-contract=0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981) · [Deployment reference](docs/DEPLOYMENT.md).

## Run and verify

Source: [`contracts/discloseguard.py`](contracts/discloseguard.py). Follow the reproducible [Studio acceptance guide](docs/STUDIO_ACCEPTANCE.md), including a positive reviewer submission and actual denial cases.

```bash
python -m unittest discover -s tests -v
python -m py_compile contracts/discloseguard.py
```

The local suite simulates GenLayer's sender, storage and consensus hooks to test authorization and version invalidation. Studio validation is evidenced separately by real signed transactions, GenVM status, validator consensus and final readbacks.

**DISCLOSEGUARD · Make reviewer independence a verifiable workflow rule.**