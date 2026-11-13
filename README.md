# MAXIMUS OTC Worker

Independent Cloudflare Worker API for OTC and regular market data.

## Features
- OTC market data
- Regular market data
- Symbols endpoint
- Candles endpoint
- Health check endpoint

## API
- `/health`
- `/symbols?venue=otc`
- `/symbols?venue=regular`
- `/candles`

The Worker implementation is stored in `worker.js`.
