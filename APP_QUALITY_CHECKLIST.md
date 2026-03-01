# LunchCrew App Quality Checklist

## ✅ Done now
- [x] Workspace auto-create / deep-link join flow works
- [x] Today's poll auto-creation works
- [x] Voting persists to Supabase
- [x] Add-option flow persists to Supabase
- [x] Loading states for vote + add option
- [x] Onboarding carousel (swipe + snap)
- [x] Onboarding restored to one-time behavior (not forced every launch)
- [x] Safe area handling switched to `react-native-safe-area-context`

## 🔄 Next recommended before store submission
- [ ] Handle network offline state with clear retry UI (workspace/poll load failures)
- [ ] Add basic crash/error logging (Sentry or similar)
- [ ] Add analytics for core events (join, vote, add option)
- [ ] Add Terms/Privacy links in-app
- [ ] Finalize app icon, splash, and store screenshots
- [ ] Add accessibility pass (labels, contrast, tap targets)
- [ ] Add E2E happy-path test (create/join/vote)

## 📦 Store readiness blockers
- [ ] Apple App Store metadata
- [ ] Google Play metadata
- [ ] Privacy policy page live on lunchcrew.app
- [ ] Support contact email configured
