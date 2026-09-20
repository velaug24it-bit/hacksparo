/**
 * Validation Middleware for Resource Requests
 * Ensures strict integrity of disaster response requests.
 */

const validateResourceRequest = (req, res, next) => {
  const { resources, peopleCount, urgency, location, description } = req.body;
  const errors = [];

  // 1. Resources validation
  if (!Array.isArray(resources) || resources.length === 0) {
    errors.push('At least one resource must be selected (e.g. food, water, medicine).');
  } else {
    const validResourceTypes = ['food', 'water', 'medicine', 'baby_supplies', 'essential_supplies', 'shelter'];
    resources.forEach((item, index) => {
      if (!item.type || !validResourceTypes.includes(item.type)) {
        errors.push(`Resource at index ${index} has an invalid type.`);
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        errors.push(`Resource "${item.type || 'unknown'}" requires a positive integer quantity.`);
      }
    });
  }

  // 2. People count validation
  const count = Number(peopleCount);
  if (isNaN(count) || count <= 0 || !Number.isInteger(count)) {
    errors.push('People count must be a positive integer greater than zero.');
  }

  // 3. Urgency validation
  const validUrgencies = ['MODERATE', 'HIGH', 'CRITICAL'];
  if (!urgency || !validUrgencies.includes(urgency)) {
    errors.push('A valid urgency level (MODERATE, HIGH, or CRITICAL) is required.');
  }

  // 4. Location validation
  if (!location || typeof location !== 'object') {
    errors.push('Location object is required.');
  } else {
    if (!location.area || typeof location.area !== 'string' || !location.area.trim()) {
      errors.push('Location area or shelter name is required.');
    }
    if (!location.city || typeof location.city !== 'string' || !location.city.trim()) {
      errors.push('City name is required.');
    }
  }

  // 5. Description validation
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('A description of the situation is required.');
  } else if (description.trim().length < 5) {
    errors.push('Situation description must be at least 5 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateResourceRequest
};
