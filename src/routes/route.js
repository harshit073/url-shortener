const express = require('express')
const {createURL, getURL} = require('../controller/urlController')
const router = express.Router()
// const shortId = require('shortid')

router.post('/url/shorten', createURL)
router.get('/:urlCode', getURL)

router.all("/**", function (req, res) {
    return res
      .status(404)
      .send({ status: false, message: "Invalid HTTP request" });
  });
module.exports = router