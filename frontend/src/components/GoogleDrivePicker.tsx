"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface Props {
  onSelect: (url: string) => void;
  label?: string;
  className?: string;
}

export default function GoogleDrivePicker({ onSelect, label = "Pick from Drive", className = "" }: Props) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;

  useEffect(() => {
    if (!apiKey || !clientId) return;
    if (typeof window === "undefined") return;

    // Load gapi
    const loadGapi = () =>
      new Promise<void>((resolve) => {
        if (window.gapi) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://apis.google.com/js/api.js";
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    // Load GIS (Google Identity Services)
    const loadGis = () =>
      new Promise<void>((resolve) => {
        if (window.google?.accounts) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    Promise.all([loadGapi(), loadGis()]).then(() => {
      window.gapi.load("picker", () => {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: (resp: any) => {
            if (resp.error) { setLoading(false); return; }
            tokenRef.current = resp.access_token;
            openPicker(resp.access_token);
          },
        });
        setReady(true);
      });
    });
  }, [apiKey, clientId]);

  const openPicker = (token: string) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
      .setOAuthToken(token)
      .setDeveloperKey(apiKey!)
      .setCallback((data: any) => {
        setLoading(false);
        if (data.action !== window.google.picker.Action.PICKED) return;
        const file = data.docs?.[0];
        if (!file) return;
        // Use a direct exportable URL — file must be shared "Anyone with link"
        const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
        onSelect(url);
      })
      .build();

    picker.setVisible(true);
  };

  const handleClick = () => {
    if (!ready || !tokenClientRef.current) return;
    setLoading(true);
    if (tokenRef.current) {
      openPicker(tokenRef.current);
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" });
    }
  };

  if (!apiKey || !clientId) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready || loading}
      className={`flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-3 py-2 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
        <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="#00AC47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.2z" fill="#EA4335"/>
        <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
        <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC"/>
        <path d="M73.4 26.5l-12.8-22.2c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
      </svg>
      <span className="text-sm">{loading ? "Opening…" : label}</span>
    </button>
  );
}
