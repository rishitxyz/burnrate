# Burnrate

**Privacy-first, local-only credit card spend analytics.**

Burnrate runs entirely on your machine. Your financial data never leaves your device — no cloud, no servers, no tracking.

## Features

- **Multi-bank support** — HDFC, ICICI, Axis, Federal Bank, Indian Bank, and more
- **Auto-import** — Drop PDF statements or set up a watch folder
- **Smart categorization** — Auto-categorize with customizable rules
- **Rich analytics** — Spend trends, category breakdowns, merchant insights
- **Transaction tagging** — Custom tags for granular tracking
- **CSV export** — Export filtered data for external analysis

## Quick Start

```bash
docker run -p 8000:8000 -v burnrate_data:/data pratik1235/burnrate:latest
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Docker Compose

```yaml
services:
  burnrate:
    image: pratik1235/burnrate:latest
    ports:
      - "8000:8000"
    volumes:
      - burnrate_data:/data
      # Optional: mount your statements folder
      # - ~/Documents/statements:/watch:ro
    environment:
      - BURNRATE_DATA_DIR=/data
      - BURNRATE_STATIC_DIR=/app/static
    restart: unless-stopped

volumes:
  burnrate_data:
```

## Watch Folder (Auto-Import)

Mount your statements directory and configure the watch folder in the app settings:

```bash
docker run -p 8000:8000 \
  -v burnrate_data:/data \
  -v ~/Documents/statements:/watch:ro \
  pratik1235/burnrate:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BURNRATE_DATA_DIR` | `/data` | Database and uploads directory |
| `BURNRATE_STATIC_DIR` | `/app/static` | Frontend static files |
| `BURNRATE_PORT` | `8000` | Server port |

## Architecture

- **Multi-stage build**: Node.js (frontend) + Python 3.12 (backend)
- **Multi-arch**: `linux/amd64` and `linux/arm64`
- **Non-root**: Runs as unprivileged `appuser`
- **Health check**: Built-in at `/api/settings`

## Links

- [GitHub Repository](https://github.com/pratik1235/burnrate)
- [Documentation](https://github.com/pratik1235/burnrate#readme)
- [Report an Issue](https://github.com/pratik1235/burnrate/issues)

## License

Apache 2.0
