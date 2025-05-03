const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/brand', async (req, res) => {
  const brandHandle = req.query.handle;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  try {
    const response = await axios.post(
      `https://${storeDomain}/admin/api/2023-10/graphql.json`,
      {
        query: `
          {
            metaobjects(type: "brand", first: 100) {
              edges {
                node {
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

    const brands = response.data.data.metaobjects.edges.map(edge => edge.node);
    const matched = brands.find(b => b.display_name?.toLowerCase().replace(/\s+/g, '-') === brandHandle);

    if (!matched) return res.status(404).send('Brand not found');
    res.json(matched);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = app;