import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";

export default function App() {
  const { getToken } = useAuth();
  const [listings, setListings] = useState([]);
  const [title, setTitle] = useState("");

  const api = async (path, opts = {}) => {
    const token = await getToken();
    const res = await fetch(path, {
      ...opts,
      headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return res.json();
  };

  const load = async () => setListings(await api("/api/listings"));

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  };

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui, sans-serif", padding: "0 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Autoace Zambia</h1>
        <SignedIn><UserButton /></SignedIn>
        <SignedOut><SignInButton /></SignedOut>
      </header>

      <SignedIn>
        <div style={{ display: "flex", gap: 8, margin: "1rem 0" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New listing title" style={{ flex: 1, padding: 8 }} />
          <button onClick={create}>Add</button>
        </div>
      </SignedIn>

      <ul>
        {listings.map((l) => (<li key={l.id}>{l.title}</li>))}
      </ul>
    </main>
  );
}
