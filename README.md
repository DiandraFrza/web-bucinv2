<!-- @format -->

# Little Love Archive

Static scrapbook site with a protected Vercel serverless save endpoint.

## Environment setup

For local development, copy `.env.local.example` to `.env.local` and fill in the values. `.env.local` is ignored by Git and is only read by the server runtime, never by the public browser page.

For Vercel production, add the same variables in Project Settings → Environment Variables because Vercel does not upload a local `.env.local` file.

## Deploy to Vercel

1. Import this folder into Vercel.
2. Create an Upstash Redis database and connect it to the Vercel project, or add these environment variables manually:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Add a private environment variable:
   - `ARCHIVE_ADMIN_KEY`
4. Deploy again after saving the variables.
5. Open `/config.html`, enter the same value as `ARCHIVE_ADMIN_KEY`, edit the archive, then click **Simpan semua perubahan**.

The public page reads `/api/archive`, so other devices see the same saved archive. The admin key is only sent for `PUT` saves and is never stored in the archive payload.

## Local development

Opening `index.html` directly still works with browser `localStorage`. Remote sync is activated automatically when the site runs on a Vercel URL. Use the config page export/import controls to move a local archive between browsers.

## Media note

Uploaded photos and audio are stored in the archive as data URLs so they can travel through JSON export/import. Keep files reasonably sized because browser storage and Redis have value-size limits; compressed images and short audio files are recommended.
