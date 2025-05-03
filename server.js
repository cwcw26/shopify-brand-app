const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/brand', async (req, res) => {
  const brandHandle = req.query.handle;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!brandHandle) {
    console.warn('❌ Missing handle parameter');
    return res.status(400).send('Missing handle');
  }

  try {
    const response = await axios.post(
      `https://${storeDomain}/admin/api/2023-10/graphql.json`,
      {
        query: `
          {
            metaobjects(type: "brand", first: 100) {
              edges {
                node {
                  id
                  handle
                  display_name
                  short_description
                  slide_images
                }
              }
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      }
    );

    console.log("✅ Raw response from Shopify:", JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.data || !response.data.data.metaobjects) {
      console.error('❌ Unexpected response structure from Shopify Admin API');
      return res.status(500).send('Invalid response from Shopify');
    }

    const brands = response.data.data.metaobjects.edges.map(edge => edge.node);
    const matched = brands.find(b => b.handle === brandHandle);

    if (!matched) {
      console.warn(`❌ No brand matched for handle: ${brandHandle}`);
      return res.status(404).send('Brand not found');
    }

    res.json(matched);
  } catch (err) {
    console.error('❌ Shopify Admin API Error:', err.message);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
    res.status(500).send('Server Error');
  }
});

module.exports = app;