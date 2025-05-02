{\rtf1\ansi\ansicpg949\cocoartf2818
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 .AppleSystemUIFontMonospaced-Regular;}
{\colortbl;\red255\green255\blue255;\red151\green0\blue126;\red0\green0\blue0;\red181\green0\blue19;
\red20\green0\blue196;\red111\green90\blue30;\red13\green100\blue1;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c66667\c5098\c56863;\csgray\c0;\cssrgb\c76863\c10196\c8627;
\cssrgb\c10980\c0\c81176;\cssrgb\c51373\c42353\c15686;\cssrgb\c0\c45490\c0;\cssrgb\c0\c0\c0;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx560\tx1120\tx1680\tx2240\tx2800\tx3360\tx3920\tx4480\tx5040\tx5600\tx6160\tx6720\pardirnatural\partightenfactor0

\f0\fs26 \cf2 const\cf3  express = require(\cf4 "express"\cf3 );\
\cf2 const\cf3  app = express();\
\cf2 const\cf3  port = \cf5 3000\cf3 ;\
\
app.use(express.urlencoded(\{ \cf6 extended\cf3 : \cf2 true\cf3  \}));\
app.use(express.json());\
\
\cf7 // \uc0\u50545  \u49444 \u52824  \u50836 \u52397  \u8594  Shopify\u44032  \u51060  \u44221 \u47196 \u47196  \u49444 \u52824  \u50836 \u52397  \u48372 \u45252 \cf3 \
app.get(\cf4 "/shopify"\cf3 , (req, res) => \{\
  \cf2 const\cf3  shop = req.query.shop;\
  \cf2 const\cf3  redirectUrl = \cf4 `https://\cf8 $\{shop\}\cf4 /admin/oauth/authorize?client_id=\cf8 $\{process.env.SHOPIFY_API_KEY\}\cf4 &scope=read_products,read_metaobjects&redirect_uri=\cf8 $\{process.env.APP_URL\}\cf4 /shopify/callback`\cf3 ;\
  res.redirect(redirectUrl);\
\});\
\
\cf7 // \uc0\u49444 \u52824  \u49849 \u51064  \u54980  \u8594  \u50529 \u49464 \u49828  \u53664 \u53360  \u48155 \u44592  (\u51076 \u49884  \u52376 \u47532 : OK\u47564  \u54364 \u49884 )\cf3 \
app.get(\cf4 "/shopify/callback"\cf3 , (req, res) => \{\
  res.send(\cf4 "\uc0\u9989  App successfully installed! You can close this window."\cf3 );\
\});\
\
\cf7 // App Proxy \uc0\u50836 \u52397  \u52376 \u47532 \cf3 \
app.get(\cf4 "/brand-proxy"\cf3 , (req, res) => \{\
  \cf2 const\cf3  handle = req.query.handle;\
  res.send(\cf4 `<h1>\uc0\u48652 \u47004 \u46300  \u49345 \u49464 \u54168 \u51060 \u51648 </h1><p>Handle: \cf8 $\{handle\}\cf4 </p>`\cf3 );\
\});\
\
app.listen(port, () => \{\
  console.log(\cf4 `Server is running on port \cf8 $\{port\}\cf4 `\cf3 );\
\});}