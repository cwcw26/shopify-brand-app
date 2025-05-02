const express = require("express");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 앱 설치 요청 → Shopify가 이 경로로 설치 요청 보냄
app.get("/shopify", (req, res) => {
    const shop = req.query.shop;
    if (!shop) {
      return res.status(400).send("Missing shop parameter.");
    }
  
    const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,read_metaobjects&redirect_uri=${process.env.APP_URL}/shopify/callback`;
    res.redirect(redirectUrl);
  });

// 설치 승인 후 → 액세스 토큰 받기 (임시 처리: OK만 표시)
app.get("/shopify/callback", (req, res) => {
  res.send("✅ App successfully installed! You can close this window.");
});

// App Proxy 요청 처리
app.get("/brand-proxy", (req, res) => {
  const handle = req.query.handle;
  res.send(`<h1>브랜드 상세페이지</h1><p>Handle: ${handle}</p>`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});