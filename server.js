const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/brand-proxy', async (req, res) => {
  const brandHandle = req.query.handle;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  console.log(`🔍 Incoming handle: ${brandHandle}`);

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
                  display_name: field(key: "display_name") { value }
                  short_description: field(key: "short_description") { value }
                  slide_images: field(key: "slide_images") { value }
                  thumbnail_image: field(key: "thumbnail_image") { value }
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

    const brands = response.data.data?.metaobjects?.edges?.map(edge => {
      const node = edge.node;
      return {
        id: node.id,
        handle: node.handle,
        display_name: node.display_name?.value,
        short_description: node.short_description?.value,
        slide_images: node.slide_images?.value,
        thumbnail_image: node.thumbnail_image?.value
      };
    });

    const matched = brands.find(b => b.handle === brandHandle);

    if (!matched) {
      console.warn('⚠️ Brand not found');
      return res.status(404).send('Brand not found');
    }

    console.log('✅ Matched brand:', matched);
    res.json(matched);

  } catch (err) {
    console.error('❌ Server Error:', err.response?.data || err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = app;