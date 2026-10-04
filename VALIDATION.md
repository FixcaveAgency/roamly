# Validation of this release

- `npm run build`: passed, Next.js 16.3.8 production compilation and TypeScript validation.
- `npm test`: 5 tests passed. Covers the 195-country denominator, territory exclusions, continent calculations, privacy redaction, compressed share decoding, malformed backups, numeric limits, budget arithmetic, route reordering, record identifiers and Unicode persistence.
- The actual passport canvas renderer and bundled map data were exercised with a native Canvas harness: 1440×1080 PNG and JPEG generated; a 106,252-byte PDF with a valid PDF header was generated through jsPDF.
- Browser: desktop map and globe, search, Bangladesh details, visited state surviving reload, region directory, phone-width place save, multi-stop planner, saved-trip UI, day outline and share-card preview checked.
- Responsive inspection used a 390px-wide browser frame. Real iOS/Android device testing was not performed.
- Download-event capture in the automated browser timed out. Raster/PDF rendering passed separately; confirm downloads in your own browser after deployment.
- Supabase account/email/cloud/public-profile flows include SQL policies but were not exercised against a live project: no credentials were supplied.
- Gemini live generation was not executed: no API key or quota was supplied. Input handling, privacy disclosure, timeouts and rendering were checked in source and the TypeScript build.
- WebMCP registration is feature-detected. A supported live registry was not available for execution testing.
- Not deployed to a Vercel account during this session. Complete source, lockfile, config, assets and deployment instructions are included.

Test-only browser records are not in the source archive. New visitors start with an empty passport.
