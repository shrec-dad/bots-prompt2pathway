const express = require('express');
const router = express.Router();
const controller = require('../controllers/metricsController');

router.get('/', controller.computeMetrics);
router.get('/:key', controller.computeMetrics);
router.post('/', controller.trackEvent);
router.delete('/', controller.resetMetrics);
router.delete('/:key', controller.resetMetrics);

module.exports = router;