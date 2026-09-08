# Mythivara AutoUploader — Railway backend

Deploy this folder as a standalone Railway service. Set the Railway root directory to `src/railway-autouploader`, add every variable in `.env.example`, attach a PostgreSQL service, and set `DATABASE_URL` to its connection string. Railway should run `npm start`.

Map the `api.mythivara.com` custom domain in Railway, then add `https://api.mythivara.com/auth/tiktok/callback` in the TikTok Developer Portal exactly.

## Routes
- `GET /auth/tiktok/login` starts TikTok Login Kit.
- `GET /auth/tiktok/callback` validates OAuth state, exchanges the authorization code, encrypts and stores tokens, and returns to the creator workspace.
- `POST /auth/tiktok/refresh` refreshes the signed-in account’s token.
- `POST /tiktok/upload` accepts multipart field `video` and sends it to the user’s TikTok inbox as a draft.
- `POST /tiktok/publish` accepts multipart field `video`, `caption`, and `privacy_setting`, then starts an official TikTok direct post.

TikTok’s current Content Posting API uses an init-and-upload flow and returns `publish_id`; it does not support publishing a previously uploaded inbox draft later by `video_id`. Direct publishing therefore submits the video file and post details together.

The backend keeps TikTok tokens encrypted at rest, uses HTTP-only secure session cookies, validates one-time OAuth state, and never returns access or refresh tokens to the browser.
.
