# Store Prep Checklist (Launch)

## Accounts
- [ ] Apple Developer account active
- [ ] Google Play Console account active

## Technical config
- [x] Expo app icon and splash assets set
- [x] Android adaptive icon assets set
- [x] `app.json` includes bundle identifiers/packages
- [x] `eas.json` added with build profiles
- [ ] Replace `extra.eas.projectId` in `app.json` after `eas init`

## Build + signing
- [ ] Run `npx eas-cli login`
- [ ] Run `npx eas-cli init`
- [ ] Build Android AAB: `npx eas-cli build -p android --profile production`
- [ ] Build iOS IPA: `npx eas-cli build -p ios --profile production`

## Store content
- [x] Draft short/full descriptions
- [ ] Final screenshots (phone sizes for both stores)
- [x] Feature graphic (1024x500)
- [ ] Privacy policy page live
- [ ] Support email live

## Submission
- [ ] Create internal testing release (Play)
- [ ] Upload TestFlight build (App Store Connect)
- [ ] Address policy questionnaires (data safety/privacy nutrition)
- [ ] Submit production release
