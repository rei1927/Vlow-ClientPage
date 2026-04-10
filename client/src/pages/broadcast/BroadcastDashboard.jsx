import React, { useState } from "react";
import RecipientsTab from "./tabs/RecipientsTab";
import TemplatesTab from "./tabs/TemplatesTab";
import BroadcastTab from "./tabs/BroadcastTab";

const BroadcastDashboard = () => {
  const [activeTab, setActiveTab] = useState("recipients");

  return (
    <div className="p-6 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">WhatsApp Broadcast (Meta Cloud API)</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-white/20 mb-6">
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "recipients" ? "border-b-2 border-blue-500 font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("recipients")}
        >
          Recipients
        </button>
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "templates" ? "border-b-2 border-blue-500 font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </button>
        <button
          className={`py-2 px-4 focus:outline-none transition-colors ${
            activeTab === "broadcast" ? "border-b-2 border-blue-500 font-semibold" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("broadcast")}
        >
          Broadcast
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content bg-[var(--card-bg)] p-6 rounded-lg shadow-lg border border-white/10">
        {activeTab === "recipients" && <RecipientsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
      </div>
    </div>
  );
};

export default BroadcastDashboard;
