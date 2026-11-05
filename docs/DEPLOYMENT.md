# DISCLOSEGUARD — Studionet deployment

- **Network:** GenLayer Studionet 61999
- **Contract address supplied by builder:** `0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981`
- **Import contract:** https://studio.genlayer.com/?import-contract=0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981
- **Explorer:** https://explorer-studio.genlayer.com/address/0x3cd3F9f47F0a8bF9BF9EFeC79613Fb9d20BD7981

A read-only GitHub Actions job verifies deployed source matches `contracts/discloseguard.py`, deployed ABI method names and `stats()` at `LATEST_FINAL`. This does not submit a transaction or claim any signed flow has been completed.

```bash
npm install
npm run preflight
```

The reproducible signed workflow is described in [STUDIO_ACCEPTANCE.md](STUDIO_ACCEPTANCE.md).
