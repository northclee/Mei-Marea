import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Google Sheets Sync
  app.post("/api/sync-sheets", async (req, res) => {
    try {
      const { products, action } = req.body; // action: 'push' or 'sync'
      const sheetId = process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEE;
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACC;
      const privateKey = (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_K)?.replace(/\\n/g, '\n');

      if (!sheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ 
          error: "Missing credentials. Ensure GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY are set in Secrets." 
        });
      }

      const serviceAccountAuth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
      await doc.loadInfo();
      
      let sheet = doc.sheetsByTitle['Inventory'];
      if (!sheet) {
        sheet = await doc.addSheet({ 
          title: 'Inventory', 
          headerValues: ['ID', 'Name', 'Category', 'Price', 'Stock', 'Brand', 'Last Sync'] 
        });
      }

      const rows = await sheet.getRows();
      const now = new Date().toISOString();
      const sheetIds = new Set();
      const updatedProducts = [];

      // 1. Process what's currently in the sheet
      for (const row of rows) {
        const id = row.get('ID');
        if (!id) continue;
        sheetIds.add(id.toString());

        // If we are syncing, the sheet is the source of truth for existing rows
        if (action === 'sync') {
          updatedProducts.push({
            id: id.toString(),
            name: row.get('Name') || '',
            category: row.get('Category') || '',
            price: Number(row.get('Price')?.toString().replace(/[^0-9.-]+/g,"")) || 0,
            stock: Number(row.get('Stock')?.toString().replace(/[^0-9.-]+/g,"")) || 0,
            brand: row.get('Brand') || ''
          });
        }
      }

      // 2. Identify products in the app that are NOT in the sheet yet (New items)
      // and push them to the sheet.
      for (const product of products) {
        if (!sheetIds.has(product.id.toString())) {
          await sheet.addRow({
            ID: product.id,
            Name: product.name,
            Category: product.category,
            Price: product.price,
            Stock: product.stock,
            Brand: product.brand || '',
            'Last Sync': now
          });
        } else if (action !== 'sync') {
          // If NOT syncing (just pushing), update the sheet with app state
          const row = rows.find(r => r.get('ID')?.toString() === product.id.toString());
          if (row) {
            row.assign({
              Name: product.name,
              Category: product.category,
              Price: product.price,
              Stock: product.stock,
              Brand: product.brand || '',
              'Last Sync': now
            });
            await row.save();
          }
        }
      }

      res.json({ 
        status: "success", 
        message: action === 'sync' ? "Bi-directional sync complete" : "Inventory pushed to sheet",
        pulledData: action === 'sync' ? updatedProducts : []
      });
    } catch (error: any) {
      console.error("Sync Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
