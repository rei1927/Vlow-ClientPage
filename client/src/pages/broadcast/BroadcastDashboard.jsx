import React, { useState } from "react";
import RecipientsTab from "./tabs/RecipientsTab";
import TemplatesTab from "./tabs/TemplatesTab";
import BroadcastTab from "./tabs/BroadcastTab";
import FeatureAccessGuard from "../../components/common/FeatureAccessGuard";

const BroadcastDashboard = () => {
  const [activeTab, setActiveTab] = useState("recipients");

  return (
    <FeatureAccessGuard feature="broadcast">
    <div className="p-6 text-[var(--color-text)] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">WhatsApp Broadcast (Meta Cloud API)</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6">
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "recipients" ? "border-b-2 border-blue-500 font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
          onClick={() => setActiveTab("recipients")}
        >
          Recipients
        </button>
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "templates" ? "border-b-2 border-blue-500 font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </button>
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "broadcast" ? "border-b-2 border-blue-500 font-semibold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
          onClick={() => setActiveTab("broadcast")}
        >
          Broadcast
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-sm border border-[var(--color-border)]">
        {activeTab === "recipients" && <RecipientsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
      </div>
    </div>
    </FeatureAccessGuard>
  );
};

export default BroadcastDashboard;
