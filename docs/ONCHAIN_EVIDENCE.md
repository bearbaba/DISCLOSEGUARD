# DISCLOSEGUARD — GenLayer Studionet evidence

**Network:** GenLayer Studionet 61999  
**Contract:** [0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981](https://explorer-studio.genlayer.com/address/0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981)

## Signed Review #1 creation

The chair signed a synthetic Project Cedar grant-review policy on November 5, 2026.

| Method | Signed by | Final status | GenVM | Consensus | Returned ID | Transaction |
| --- | --- | --- | --- | --- | --- | --- |
| `create_review` | `0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb` | FINALIZED | SUCCESS | Accepted | `1` | [0x2e255274…08be25](https://explorer-studio.genlayer.com/tx/0x2e255274a31adc0bc26ba8ebbbef753e41b292a5c90e91675af65c465b08be25) |

- **Title:** Grant Round Alpha reviewer eligibility
- **Subject:** Synthetic grant assessment of Project Cedar, an open-source data indexing tool.
- **Conflict rules:** Paid adviser, employee, founder, direct owner or active contractor of the applicant must recuse. Incomplete or ambiguous disclosures require manual review.
- **Authority:** The chair wallet is the signer of `create_review`; no claim of independent real-world identity validation.
- **Source and schema:** [Read-only Studionet deployment preflight](https://github.com/bearbaba/DISCLOSEGUARD/actions/runs/42039328637) previously verified deployed source matches the GitHub contract and all 16 methods are present.

## Signed reviewer assignment

The Chair assigned reviewer wallet `0x60Bfdf6315294c7856Acdc0B80D7Bd40217DEBff` to Review #1 using `assign_reviewer(1, reviewer_wallet)`.

| Method | Signed by | Final status | GenVM | Consensus | Return value | Transaction |
| --- | --- | --- | --- | --- | --- | --- |
| `assign_reviewer(1, 0x60Bf…eBff)` | Chair `0x4C7c…8Dcb` | FINALIZED | SUCCESS | Accepted | Assignment version `1` | [0xe01ea7f9…d9ac32](https://explorer-studio.genlayer.com/tx/0xe01ea7f981cff80104652d5affe4e216c849954a335b2da95bfac00f0bd9ac32) |

Assignment grants no immediate review-submission authorization: `submit_review` separately requires the assigned wallet's disclosure and a current GenLayer `ELIGIBLE` verdict. The reviewer has not yet submitted a conflict-of-interest disclosure in the recorded evidence.

Each next signed operation must have its own receipt and final-state readback.
