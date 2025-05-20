# ABB Sales Orders Power Pages App

This repository provides a minimal starting point for an ABB-themed sales order tracker in Microsoft Power Pages. All application settings live in `config.json` so you can adjust things like column mappings and colors without touching code.

## Configuring the app

1. Edit `config.json` to change the site name, theme colors, column mappings, or notification options. These settings are loaded by your Power Pages site at runtime.
2. Upload the contents of this repository to your Power Pages environment. Place `config.json` in the root of the site or wherever your configuration files are stored.

Example settings:

```json
{
  "siteName": "ABB Sales Orders",
  "theme": {
    "primaryColor": "#E60012",
    "secondaryColor": "#FFFFFF"
  },
  "columnMappings": {
    "Cust. Material": "material",
    "First Date": "requestedDate"
  },
  "notifications": { "email": "orders@example.com" }
}
```

Adjust these values to match your data and branding. Once deployed, the Power Pages application will use them to render your sales order pages.
