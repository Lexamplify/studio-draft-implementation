const functions = require("firebase-functions");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

// ← Replace with Account B’s hosting URL (step 3.1 below)
const PRODUCTS_HOSTING_URL = "https://lexamplify-products.web.app";

const app = express();

// Proxy any request under /products/* to Account B’s site:
app.use(
  "/products",
  createProxyMiddleware({
    target: PRODUCTS_HOSTING_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/products": "",
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(502).send("Bad Gateway");
    },
  })
);

exports.productsProxy = functions.https.onRequest(app);
