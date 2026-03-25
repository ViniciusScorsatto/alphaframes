# Financial Video Studio

Production-ready Next.js + Remotion dashboard for generating 1080x1920 short-form videos from crypto, stock, and ETF market data.

## Features

- Modular dashboard with batch ticker input
- Separate data layer for CoinGecko and Yahoo Finance
- Template engine with reusable JSON output
- Live Remotion preview inside the dashboard
- Local MP4 rendering for single or batch outputs
- Local saved history and content idea suggestions

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Remotion
- Zod

## Project Structure

```text
app/
components/
data/
lib/
remotion/
templates/
types/
video/
```

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Render an MP4

Use the dashboard `Render Video` button, or run:

```bash
npm run render
```

Generated dashboard renders are saved to `public/renders/`.

## Supported Templates

- `LAST_30_DAYS`
- `LAST_1_YEAR`
- `BEST_DAY_TO_BUY`
- `DCA_STRATEGY`
- `THEN_VS_NOW`

## Notes

- Crypto data is fetched from CoinGecko.
- Stocks and ETFs are fetched from Yahoo Finance chart data.
- Results are normalized before template generation, so UI and video logic stay decoupled from providers.
