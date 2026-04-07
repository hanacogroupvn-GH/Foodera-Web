# Personalization Model

## Visitor Identity

- `foodmax_visitor` cookie stores a stable device/browser visitor id.
- The server also hashes IP and user-agent for continuity when the cookie is missing.
- Raw IP is not persisted in the recommendation model. Only hashed identifiers are stored.

## Data Collection

The site records these event families in `personalization_events`:

- `page:view`
- `category:view`
- `product:click`
- `product:view`
- `news:click`
- `news:view`
- `quote_request:submit`

Tracked surfaces:

- Route navigation
- Product cards
- Product detail pages
- Product category browsing
- News archive cards
- News detail pages
- Quote request submission

## Processing Pipeline

1. Store each behavior event with visitor id, item/category metadata, and a base weight.
2. Rebuild the active visitor profile from the last 90 days of events.
3. Apply time decay with a 14-day half-life so fresh intent dominates old behavior.
4. Aggregate weighted signals into:
   - category scores
   - sub-category scores
   - news-category scores
   - product scores
   - news scores
5. Persist the compact profile snapshot in `personalization_profiles`.

## Recommendation Algorithm

The recommender uses a hybrid strategy (`hybrid-v1`):

- Content-based scoring:
  - match `product.category`
  - match `product.subCategory`
  - match `news.category`
  - match product-category terms inside news content
- Direct intent scoring:
  - repeated product/news views increase the exact item score
  - quote requests receive the strongest weight
- Collaborative boost:
  - compare the current visitor profile against recent visitor profiles
  - use cosine similarity on top categories, sub-categories, products, and news
  - borrow product/news signals from the most similar visitors
- Freshness:
  - news receives a recency bonus
- Repeat penalty:
  - already viewed items are slightly penalized to keep recommendations from becoming static

## API

- `GET /api/personalization/recommendations`
- `POST /api/personalization/events`

Both endpoints return the current visitor profile plus personalized product/news candidates.

## UI Surfaces

- Home page: `Recommended for This Device`
- Product detail: personalized related products
- News detail: personalized related insights

## Next Extensions

- Track dwell time with `sendBeacon`
- Add admin analytics for top segments
- Add email personalization for returning B2B leads
- Add profile resets / consent management if needed
