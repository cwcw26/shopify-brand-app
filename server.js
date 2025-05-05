// ✅ server.js (Express API)
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/brand-proxy', async (req, res) => {
  const brandHandle = req.query.handle;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!brandHandle) {
    return res.status(400).send('Missing handle');
  }

  try {
    // Step 1: Fetch brand metaobjects
    const response = await axios.post(
      `https://${storeDomain}/admin/api/2023-10/graphql.json`,
      {
        query: `{
          metaobjects(type: "brand", first: 100) {
            edges {
              node {
                id
                handle
                fields {
                  key
                  value
                }
              }
            }
          }
        }`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      }
    );

    const brands = response.data?.data?.metaobjects?.edges?.map(edge => {
      const node = edge.node;
      const fieldMap = {};

      for (const field of node.fields) {
        fieldMap[field.key] = field.value;
      }

      return {
        id: node.id,
        handle: node.handle,
        ...fieldMap
      };
    }) || [];

    const matched = brands.find(b => b.handle === brandHandle);
    if (!matched) return res.status(404).send('Brand not found');

    // Step 2: Convert GIDs to URLs
    let slideImageGids = [];
    try {
      slideImageGids = JSON.parse(matched.slide_images || '[]');
    } catch (e) {
      slideImageGids = [];
    }

    const imageUrls = await Promise.all(
      slideImageGids.map(async (gid) => {
        try {
          const imgRes = await axios.post(
            `https://${storeDomain}/admin/api/2023-10/graphql.json`,
            {
              query: `{
                node(id: "${gid}") {
                  ... on MediaImage {
                    image { url }
                  }
                }
              }`
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
              }
            }
          );
          return imgRes.data.data.node?.image?.url || null;
        } catch {
          return null;
        }
      })
    );

    res.json({
      id: matched.id,
      handle: matched.handle,
      display_name: matched.display_name,
      short_description: matched.short_description,
      thumbnail_image: matched.thumbnail_image,
      slide_images: imageUrls.filter(Boolean)
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = app;