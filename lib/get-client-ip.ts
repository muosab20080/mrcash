// Fetches the current public IP address of the client device.
// Used for anti-cheat/VPN tracking on login, profile edits, and withdrawal requests.
export async function getClientIp(): Promise<string | null> {
  // Try a couple of providers for resilience.
  const providers = [
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/",
  ];

  for (const url of providers) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const ip = data?.ip || null;
      if (ip) return ip as string;
    } catch {
      // Try next provider
    }
  }

  return null;
}
