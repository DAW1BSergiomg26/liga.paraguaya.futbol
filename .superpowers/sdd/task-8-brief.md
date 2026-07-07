# Task 8: Service Worker + PushSetup + Layout Registration

## Files
- Create: `frontend/public/sw.js`
- Create: `frontend/src/components/PushSetup.tsx`
- Modify: `frontend/src/app/layout.tsx`

## Important: Layout is a Server Component
`layout.tsx` uses `export const metadata` (server-only). Do NOT add `"use client"`. Instead, PushSetup handles both SW registration and push subscription, and is safely nestable inside server components as a client boundary.

## Exact Code

### frontend/public/sw.js
```js
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, icon, badge, data: extra } = data;

  event.waitUntil(
    self.registration.showNotification(title || "Liga Paraguaya", {
      body: body || "",
      icon: icon || "/icon-192.png",
      badge: badge || "/badge-72.png",
      data: extra || {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

### frontend/src/components/PushSetup.tsx
```tsx
"use client";

import { useEffect } from "react";

export default function PushSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker.register("/sw.js");

    // Set up push subscription if PushManager is available
    if (!("PushManager" in window)) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";

    async function setup() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidResponse = await fetch(`${apiUrl}/api/v1/notificaciones/vapid-public-key`);
        const { publicKey } = await vapidResponse.json();
        const keyBytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes,
        });
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        await fetch(`${apiUrl}/api/v1/notificaciones/suscribir`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Notification permission denied or unavailable
      }
    }
    setup();
  }, []);

  return null;
}
```

### Edit frontend/src/app/layout.tsx
Add import for PushSetup:
```tsx
import PushSetup from "@/components/PushSetup";
```
Then add `<PushSetup />` in the JSX body (e.g. before closing `</body>`):
```tsx
<PushSetup />
```

Do NOT add `"use client"` directive. The layout stays as a server component.

## Global Constraints
- Service Worker is vanilla JS (in `public/`)
- Layout stays server component (no `"use client"`)
- PushSetup is a client component (`"use client"`) — can be nested in server layout

## Commit
```bash
git add frontend/public/sw.js frontend/src/components/PushSetup.tsx frontend/src/app/layout.tsx
git commit -m "feat: add service worker and push subscription setup"
```

## Report File
`.superpowers/sdd/task-8-report.md`
