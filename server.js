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

    // Step 2: slide_images 파싱
    let slideImageGids = [];
    try {
      slideImageGids = JSON.parse(matched.slide_images || '[]');
      console.log(`[${brandHandle}] Raw slide_images:`, slideImageGids);
    } catch (e) {
      console.warn('❌ Failed to parse slide_images');
      slideImageGids = [];
    }

    // ✅ Step 3: 테스트용 GID 하나 요청
    const testGid = "gid://shopify/MediaImage/32519380271164"; // 이 GID는 실제 값이어야 함
    const testImgRes = await axios.post(
      `https://${storeDomain}/admin/api/2023-10/graphql.json`,
      {
        query: `
          {
            node(id: "${testGid}") {
              __typename
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

    console.log("✅ Test GID result:", JSON.stringify(testImgRes.data, null, 2));

    // 임시 응답 (브랜드 본문 대신 테스트 결과만 반환)
    res.json({
      test_gid: testGid,
      raw_slide_images: slideImageGids,
      test_result: testImgRes.data
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