import { PlasmoManifest } from "plasmo"

const manifest: PlasmoManifest = {
  version: "3.0.0",
  name: "ReadFocus - AI Content Summary",
  description: "Transform any webpage into intelligent, digestible summaries with AI-powered analysis",
  
  permissions: [
    "activeTab",
    "storage"
  ],
  
  host_permissions: [
    "https://api.anthropic.com/*"
  ],

  action: {
    default_title: "ReadFocus - AI Content Summary"
  }
}

export default manifest