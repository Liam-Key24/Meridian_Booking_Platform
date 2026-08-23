# Booking feature components

- `BookingRequestForm` — public Meridian request form
- `BookingWidget` — reusable meridian / external / hybrid surface for client templates and `/book/[businessSlug]`

Embed example for Meridian client sites:

```tsx
import { BookingWidget } from "@/components/booking/booking-widget";

<BookingWidget
  businessName="Aura Salon"
  businessSlug="aura-salon"
  bookingMode="hybrid"
  externalBookingUrl="https://example.com/book"
  services={services}
/>
```

No Fresha / Treatwell / Google Calendar sync — modes only control Meridian requests vs an external link.
