// src/pages/admin/ReceptionistSettings.tsx - UNIVERSAL VERSION (No Provider Lock-in)
import React, { useState, useEffect } from 'react';
import { getJSON, setJSON } from '@/lib/storage';

interface ReceptionistConfig {
  // UNIVERSAL Voice/Phone - Use YOUR webhook
  voiceWebhookUrl: string;
  voiceApiKey?: string;
  phoneNumber: string;
  transferNumber?: string;
  
  // UNIVERSAL Calendar - Use YOUR webhook
  calendarWebhookUrl: string;
  calendarApiKey?: string;
  
  // Business Configuration
  businessHours: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  services: Array<{
    name: string;
    duration: number;
    price?: number;
  }>;
  
  // Scripts & Messages
  greeting?: string;
  fallbackMessage?: string;
  
  // Optional: Provider hints (for YOUR backend to route correctly)
  providerHints?: {
    voiceProvider?: string; // "vapi", "bland", "elevenlabs", "twilio", etc.
    calendarProvider?: string; // "tidycal", "calendly", "google", "cal.com", etc.
  };
}

interface Props {
  instanceId?: string;
  templateKey?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ReceptionistSettings({ instanceId, templateKey }: Props) {
  const settingsKey = instanceId 
    ? `receptionistSettings:inst:${instanceId}` 
    : `receptionistSettings:tpl:${templateKey || 'Receptionist'}`;
  
  const [settings, setSettings] = useState<ReceptionistConfig>(() => {
    const stored = getJSON<ReceptionistConfig>(settingsKey, null);
    return stored || {
      voiceWebhookUrl: '',
      phoneNumber: '',
      calendarWebhookUrl: '',
      businessHours: {
        Monday: { open: '09:00', close: '17:00' },
        Tuesday: { open: '09:00', close: '17:00' },
        Wednesday: { open: '09:00', close: '17:00' },
        Thursday: { open: '09:00', close: '17:00' },
        Friday: { open: '09:00', close: '17:00' },
        Saturday: { closed: true, open: '09:00', close: '17:00' },
        Sunday: { closed: true, open: '09:00', close: '17:00' },
      },
      services: [],
      greeting: 'Hello! Thank you for calling. How may I help you today?',
      fallbackMessage: 'I\'m sorry, I didn\'t understand that. Could you please repeat?',
      providerHints: {},
    };
  });

  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 });
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    setJSON(settingsKey, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  const addService = () => {
    if (!newService.name.trim()) return;
    setSettings(prev => ({
      ...prev,
      services: [...prev.services, { ...newService }],
    }));
    setNewService({ name: '', duration: 30, price: 0 });
  };

  const removeService = (index: number) => {
    setSettings(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const cardClass = "rounded-2xl border-2 border-black bg-white p-5 shadow-lg";
  const headerClass = "rounded-2xl border-2 border-black p-5 bg-gradient-to-r from-sky-100 via-cyan-100 to-emerald-100";
  const labelClass = "text-xs font-bold uppercase text-purple-700 mb-2";
  const inputClass = "w-full border-2 border-purple-200 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400";

  return (
    <div className="p-6 space-y-6">
      <div className={headerClass}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">☎️ Receptionist Settings (Universal)</h2>
            <p className="text-sm text-foreground/80 mt-1">
              Configure webhooks, phone, calendar, and business hours. <strong>No provider lock-in</strong> - use any service you want!
            </p>
          </div>
          <button
            onClick={saveSettings}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white font-bold rounded-xl shadow-[0_3px_0_#000] active:translate-y-[1px] hover:shadow-lg transition border-2 border-black"
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* UNIVERSAL Voice/Phone Integration */}
      <div className={cardClass}>
        <h3 className="text-xl font-extrabold mb-2">☎️ Voice & Phone (Universal Webhook)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide YOUR webhook URL. Your backend can connect to Vapi, Bland, ElevenLabs, Twilio, or any voice AI service.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Voice Webhook URL (Required)</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/voice/receptionist"
              className={inputClass}
              value={settings.voiceWebhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, voiceWebhookUrl: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your backend endpoint that handles incoming calls. You decide which voice AI provider to use.
            </p>
          </div>

          <div>
            <label className={labelClass}>Voice API Key / Secret (Optional)</label>
            <input
              type="password"
              placeholder="Your API key or secret"
              className={inputClass}
              value={settings.voiceApiKey || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, voiceApiKey: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Authentication key for your voice webhook (if needed)
            </p>
          </div>

          <div>
            <label className={labelClass}>Business Phone Number</label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              className={inputClass}
              value={settings.phoneNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your business phone number (from any provider: Twilio, Vonage, etc.)
            </p>
          </div>

          <div>
            <label className={labelClass}>Transfer Number (Optional)</label>
            <input
              type="tel"
              placeholder="+1 (555) 987-6543"
              className={inputClass}
              value={settings.transferNumber || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, transferNumber: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number to transfer calls when human assistance is needed
            </p>
          </div>

          {/* Provider Hint (Optional) */}
          <div>
            <label className={labelClass}>Voice Provider (Optional Hint)</label>
            <input
              type="text"
              placeholder="e.g., vapi, bland, elevenlabs, twilio"
              className={inputClass}
              value={settings.providerHints?.voiceProvider || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                providerHints: { 
                  ...prev.providerHints, 
                  voiceProvider: e.target.value 
                }
              }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Tell your backend which provider you're using (for routing purposes)
            </p>
          </div>
        </div>
      </div>

      {/* UNIVERSAL Calendar Integration */}
      <div className={cardClass}>
        <h3 className="text-xl font-extrabold mb-2">📅 Calendar (Universal Webhook)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide YOUR webhook URL. Your backend can connect to TidyCal, Calendly, Google Calendar, Cal.com, or any calendar service.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Calendar Webhook URL (Required)</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/calendar/book"
              className={inputClass}
              value={settings.calendarWebhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, calendarWebhookUrl: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your backend endpoint that creates appointments. You decide which calendar provider to use.
            </p>
          </div>

          <div>
            <label className={labelClass}>Calendar API Key / Secret (Optional)</label>
            <input
              type="password"
              placeholder="Your calendar API key"
              className={inputClass}
              value={settings.calendarApiKey || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, calendarApiKey: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Authentication key for your calendar webhook (if needed)
            </p>
          </div>

          {/* Provider Hint (Optional) */}
          <div>
            <label className={labelClass}>Calendar Provider (Optional Hint)</label>
            <input
              type="text"
              placeholder="e.g., tidycal, calendly, google, cal.com"
              className={inputClass}
              value={settings.providerHints?.calendarProvider || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                providerHints: { 
                  ...prev.providerHints, 
                  calendarProvider: e.target.value 
                }
              }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Tell your backend which calendar you're using (for routing purposes)
            </p>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className={cardClass}>
        <h3 className="text-xl font-extrabold mb-4">🕒 Business Hours</h3>
        
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-28 font-bold text-sm">{day}</div>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!settings.businessHours[day]?.closed}
                  onChange={(e) => updateBusinessHours(day, 'closed', !e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold">Open</span>
              </label>

              {!settings.businessHours[day]?.closed && (
                <>
                  <input
                    type="time"
                    className="border-2 border-purple-200 rounded px-2 py-1 text-sm font-semibold"
                    value={settings.businessHours[day]?.open || '09:00'}
                    onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                  />
                  <span className="text-sm text-gray-500 font-semibold">to</span>
                  <input
                    type="time"
                    className="border-2 border-purple-200 rounded px-2 py-1 text-sm font-semibold"
                    value={settings.businessHours[day]?.close || '17:00'}
                    onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className={cardClass}>
        <h3 className="text-xl font-extrabold mb-4">💼 Services Offered</h3>
        
        <div className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelClass}>Service Name</label>
              <input
                type="text"
                placeholder="e.g., Consultation"
                className={inputClass}
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="w-32">
              <label className={labelClass}>Duration (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                className={inputClass}
                value={newService.duration}
                onChange={(e) => setNewService(prev => ({ ...prev, duration: Number(e.target.value) }))}
              />
            </div>
            
            <div className="w-32">
              <label className={labelClass}>Price ($)</label>
              <input
                type="number"
                min="0"
                step="10"
                className={inputClass}
                value={newService.price}
                onChange={(e) => setNewService(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
            </div>
            
            <button
              onClick={addService}
              className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 border-2 border-black shadow"
            >
              + Add
            </button>
          </div>

          {settings.services.length > 0 && (
            <div className="space-y-2 mt-4">
              {settings.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div>
                    <div className="font-bold">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {service.duration} min • ${service.price || 0}
                    </div>
                  </div>
                  <button
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700 font-bold px-3 py-1 border-2 border-red-500 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Scripts */}
      <div className={cardClass}>
        <h3 className="text-xl font-extrabold mb-4">💬 Conversation Scripts</h3>
        
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Greeting Message</label>
            <textarea
              className={inputClass + " h-24"}
              placeholder="Hello! Thank you for calling..."
              value={settings.greeting}
              onChange={(e) => setSettings(prev => ({ ...prev, greeting: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelClass}>Fallback Message</label>
            <textarea
              className={inputClass + " h-20"}
              placeholder="I'm sorry, I didn't understand..."
              value={settings.fallbackMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, fallbackMessage: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
        <h4 className="font-bold text-purple-900 mb-2">🔓 Universal & Future-Proof</h4>
        <p className="text-sm text-purple-800">
          This system uses <strong>webhooks</strong>, so you're never locked into a specific provider. 
          Your backend can route to Vapi, Bland, ElevenLabs, Twilio, TidyCal, Calendly, Google Calendar, 
          or any other service. Switch providers anytime without changing this configuration!
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-500 text-white font-bold rounded-xl shadow-[0_3px_0_#000] active:translate-y-[1px] hover:shadow-lg transition text-lg border-2 border-black"
        >
          {saved ? '✓ Saved Successfully!' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}

export default ReceptionistSettings;
