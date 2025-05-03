const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN; // 예: gdte2c-a8.myshopify.com

app.use(cors());

app.get('/brand/:handle', async (req, res) => {
  const brandHandle = req.params.handle;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/metaobjects.json?type=brand`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.metaobjects || data.metaobjects.length === 0) {
      return res.status(404).json({ error: 'No brand metaobjects found' });
    }

    const matchedBrand = data.metaobjects.find((brand) => brand.handle === brandHandle);

    if (!matchedBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.status(200).json({ brand: matchedBrand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand metaobject' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});