---
name: Express image route ordering
description: Static path segments (/articles/image) must be registered before param routes (/articles/:id) to avoid Express matching the literal "image" as an id param.
---

**Rule:** Register `/articles/image` (POST) before `/articles/:id` (GET/DELETE/PATCH) in the router.

**Why:** Express matches routes in registration order. If `:id` is registered first, a request to `/articles/image` will match it with `id = "image"`, causing parseInt to return NaN and a 400 or 404 instead of the intended handler.

**How to apply:** Always put concrete path segments above parameterized ones in the same router file.
