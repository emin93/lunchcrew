# Analytics v1 (Supabase-first)

No custom UI required. Use Supabase SQL editor + table/view charting.

## Data source
- Table: `public.analytics_events`
- Views:
  - `public.analytics_daily_overview`
  - `public.analytics_feature_adoption`

## Tracked events (v1)
- `workspace_created`
- `workspace_joined`
- `display_name_set`
- `poll_option_added` (`props.source=manual|google_place`)
- `vote_cast`
- `maps_opened`
- `menu_opened`
- `location_permission_result` (`props.status=granted|denied`)
- `realtime_status` (`props.status=subscribed|fallback_polling`)
- `pricing_viewed` (`props.placement=app_card`)
- `upgrade_cta_clicked` (`props.placement=app_card`)
- `waitlist_joined` / `waitlist_submit_failed`

## Recommended dashboard charts (Supabase)
1. Daily active devices + votes
```sql
select * from public.analytics_daily_overview order by day desc limit 30;
```

2. Smart-option adoption
```sql
select * from public.analytics_feature_adoption order by day desc limit 30;
```

3. Realtime health
```sql
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where props->>'status' = 'subscribed') as realtime_subscribed,
  count(*) filter (where props->>'status' = 'fallback_polling') as fallback_polling
from public.analytics_events
where event_name = 'realtime_status'
group by 1
order by 1 desc;
```

4. Click-through to maps/menu
```sql
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_name='maps_opened') as maps_clicks,
  count(*) filter (where event_name='menu_opened') as menu_clicks
from public.analytics_events
group by 1
order by 1 desc;
```
