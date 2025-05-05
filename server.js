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
    console.warn('❌ Missing handle parameter');
    return res.status(400).send('Missing handle');
  }

  try {
    // Step 1: 브랜드 메타객체 조회
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
                  fields {
                    key
                    value
                  }
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
    if (!matched) {
      console.warn(`❌ No brand matched for handle: ${brandHandle}`);
      return res.status(404).send('Brand not found');
    }

    // Step 2: slide_images 필드 파싱 → GID 배열
    let slideImageGids = [];
    try {
      slideImageGids = JSON.parse(matched.slide_images || '[]');
    } catch (e) {
      console.warn('❌ Failed to parse slide_images');
      slideImageGids = [];
    }

    // Step 3: 각 GID에 대해 이미지 URL 조회
    const imageUrls = await Promise.all(
      slideImageGids.map(async (gid) => {
        try {
          const imgRes = await axios.post(
            `https://${storeDomain}/admin/api/2023-10/graphql.json`,
            {
              query: `
                {
                  node(id: "${gid}") {
                    ... on MediaImage {
                      image {
                        url
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

          return imgRes.data.data.node?.image?.url || null;
        } catch (e) {
          console.error(`❌ Failed to fetch image for ${gid}:`, e.message);
          return null;
        }
      })
    );

    // Step 4: 최종 응답 구성
    res.json({
      id: matched.id,
      handle: matched.handle,
      display_name: matched.display_name,
      short_description: matched.short_description,
      thumbnail_image: matched.thumbnail_image,
      slide_images: imageUrls.filter(Boolean) // null 제거
    });
  } catch (err) {
    console.error('❌ Shopify Admin API Error:', err.message);
    if (err.response) {
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
    res.status(500).send('Server Error');
  }
});

module.exports = app;