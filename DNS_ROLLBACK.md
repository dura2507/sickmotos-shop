# DNS Rollback — sick-motos.com

Snapshot taken 2026-07-09 before the switch from Shopify to Vercel.
If anything breaks on the new site, restore these values at GoDaddy DNS to
route sick-motos.com back to the old Shopify shop.

## Records to restore (Shopify state)

| Type  | Name             | Value                                 | TTL  |
|-------|------------------|---------------------------------------|------|
| A     | @                | 23.227.38.32                          | 600s |
| CNAME | www              | sick-motos.com.                       | 1 Hr |
| CNAME | account          | shops.myshopify.com.                  | 1 Hr |

## Records that must NOT be touched (keep as-is)

| Type  | Name             | Value                                                 |
|-------|------------------|-------------------------------------------------------|
| NS    | @                | ns31.domaincontrol.com.                               |
| NS    | @                | ns32.domaincontrol.com.                               |
| CNAME | _domainconnect   | _domainconnect.gd.domaincontrol.com.                  |
| TXT   | @                | google-site-verification=o-lXmqtT_wgEBV_TOsxkSdE0YEVaDqwU8CDnc6GD4a4 |
| TXT   | @                | google-site-verification=TOZ7faVel1q4jD6iFiysmNb1T7pLGn32nBG-uT1RH-U |
| TXT   | trustpilot       | trustpilot-one-time-verification-id=c0532e1e-467a-4ed7-8971-be161ed6ec86 |

## After the switch (target Vercel state)

| Type  | Name | Value                     |
|-------|------|---------------------------|
| A     | @    | 76.76.21.21               |
| CNAME | www  | cname.vercel-dns.com      |

## Rollback procedure

1. Log into GoDaddy: https://dcc.godaddy.com/manage/dns?domainName=sick-motos.com
2. Edit `A @` back to `23.227.38.32`
3. Edit `CNAME www` back to `sick-motos.com.` (self-reference, Shopify handles it)
4. Re-add `CNAME account → shops.myshopify.com` if it was removed by the template drop
5. Wait 10-30 min for DNS propagation (TTL is 600s so ~10 min)

## The old Shopify shop is safe regardless

- Shop content and admin remain accessible via https://sickmotos.myshopify.com
- Products, orders, customers, settings — all untouched by DNS changes
- Uninstalling the paid Shopify apps (EasySearch YMM $19/mo, Instant AI Page
  Builder $39/mo) is a separate later step, do NOT do it until the new site is
  stable for at least a week.
