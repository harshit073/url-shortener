const express = require('express')
const {createURL, getURL} = require('../controller/urlController')
const router = express.Router()
// const shortId = require('shortid')

router.post('/url/shorten', createURL)
router.get('/:urlCode', getURL)
module.exports = router