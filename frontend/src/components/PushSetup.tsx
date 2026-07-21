"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function PushSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker.register("/sw.js");

    // Set up push subscription if PushManager is available
    if (!("PushManager" in window)) return;

    async function setup() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const { publicKey } = await apiFetch<{ publicKey: string }>("/api/v1/notificaciones/vapid-public-key");
        const keyBytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes,
        });
        const token = localStorage.getItem("user_token");
        if (!token) return;
        await apiFetch("/api/v1/notificaciones/suscribir", {
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
