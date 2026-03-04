"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";


export default function SettingsPage() {
    return (
        <div className="p-6 space-y-6 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-white">Settings</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">API credentials and dashboard configuration</p>
            </div>

            <Suspense fallback={null}>
            </Suspense>

            <div className="space-y-4">
                {/* Meta API */}
                <section className="rounded-xl border border-[#252836] bg-[#12141a] p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-white">Meta API</h2>
                    {[
                        { label: "App ID", key: "META_APP_ID" },
                        { label: "Ad Account ID", key: "META_AD_ACCOUNT_ID", hint: "Format: act_123456789" },
                        { label: "Access Token", key: "META_ACCESS_TOKEN", secret: true },
                    ].map(({ label, key, hint, secret }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1.5">{label}</label>
                            <input
                                type={secret ? "password" : "text"}
                                placeholder={hint ?? key}
                                className="w-full px-3 py-2.5 rounded-lg bg-[#1a1d26] border border-[#252836] text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-indigo-500/60 transition-colors"
                                readOnly
                            />
                        </div>
                    ))}
                </section>


                {/* Note */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                    <strong>Credentials are managed via <code>.env.local</code></strong> — edit that file in your project root to update API keys. Restart the dev server after changes.
                </div>
            </div>
        </div>
    );
}

