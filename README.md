# Ledger &mdash; Order Processing Console

A React (Vite) frontend for the `OrderProcessingSystem` Spring Boot backend.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at
`http://localhost:8080` (change this in `.env` via `VITE_API_BASE_URL` if
your backend runs elsewhere). Start the Spring Boot app first, or the
pages will show connection errors when they try to load data.

The backend needs CORS enabled for the frontend's origin, since it isn't
configured with any CORS policy out of the box. Add something like this to
the Spring Boot app (e.g. as a `@Configuration` bean):

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:5173")
                    .allowedMethods("GET", "POST", "PUT", "DELETE");
        }
    };
}
```

## Pages and endpoints used

| Page | Backend endpoint(s) |
|---|---|
| **Inventory** (`/products`) | `GET /api/products`, `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` |
| **Orders** (`/orders`) | `GET /api/products` (to populate the picker), `POST /api/orders` with an `Idempotency-Key` header |
| **Payments** (`/payments`) | `POST /api/payments` |

## Notes on the backend's shape

- **Idempotency**: every order submission generates a fresh
  `crypto.randomUUID()` and sends it as `Idempotency-Key`. Resubmitting the
  same key returns the original order rather than creating a duplicate, so
  the key is only reused if you retry the exact same request object
  yourself.
- **No order/payment listing endpoints**: the backend only exposes `POST
  /api/orders` and `POST /api/payments` &mdash; there's no `GET` to list past
  orders or payments. The Orders and Payments pages keep a running list in
  `sessionStorage` for the current browser tab so you can see what you've
  just created; it resets when the tab closes and isn't shared across
  devices or reloaded from the server.
- **Simulated gateway failures**: `FakePaymentGateway` fails about 30% of
  the time on purpose, and a Resilience4j circuit breaker wraps the call.
  A failed or open-circuit payment still returns HTTP 201 with
  `status: "CANCELLED"` (via the configured fallback) rather than an HTTP
  error, so the UI treats that as a normal response and marks the
  underlying order cancelled.
- **Error messages**: Spring's default error body shape depends on how (or
  whether) you've added exception handling. `src/api/client.js` tries a
  few common shapes (`message`, `error`, validation `errors[]`) and falls
  back to a generic message if none match &mdash; adjust
  `extractErrorMessage` if you add a custom `@ControllerAdvice`.

## Project structure

```
src/
  api/            axios client + one module per controller
  components/     Sidebar, StatusPill, EmptyState
  context/        toast notification provider
  pages/          ProductsPage, OrdersPage, PaymentsPage
  App.jsx         routes
  main.jsx        entry point
  index.css       design system (tokens, layout, components)
```
