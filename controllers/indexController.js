const { Testimonial, Stat, FooterLinkColumn, SiteInfo } = require('../models/indexModel');

// --- Helper for handling async errors ---
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    console.error(`[CONTROLLER_ERROR] ${err.message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
    next(err);
  });
};

// --- Testimonial Controller Logic ---

// @desc    Get all testimonials
const getTestimonials = asyncHandler(async (req, res) => {
  console.log(`[API] GET /api/v1/index/testimonials - Fetching all testimonials...`);
  const testimonials = await Testimonial.find({});
  console.log(`[DB] Found ${testimonials.length} testimonials.`);
  res.status(200).json(testimonials);
});

// @desc    Create a new testimonial
const createTestimonial = asyncHandler(async (req, res) => {
  console.log(`[API] POST /api/v1/index/testimonials - Creating new testimonial...`);
  console.log(`[DATA] Request body:`, req.body);

  let { quote, authorName, authorInfo, authorImage } = req.body;

  if (!quote || !authorName || !authorInfo) {
    console.warn(`[VALIDATION_FAIL] Missing required fields.`);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (authorImage && authorImage.startsWith('data:image')) {
    // Optional: Upload to Cloudinary
    console.log('[INFO] Base64 author image detected. Stored directly in DB.');
  }

  const testimonial = await Testimonial.create({ quote, authorName, authorInfo, authorImage });
  console.log(`[DB] Created new testimonial with ID: ${testimonial._id}`);
  res.status(201).json(testimonial);
});

// @desc    Update a testimonial
const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonialId = req.params.id;
  console.log(`[API] PUT /api/v1/index/testimonials/${testimonialId} - Updating testimonial...`);

  const testimonial = await Testimonial.findById(testimonialId);
  if (!testimonial) {
    console.warn(`[NOT_FOUND] Testimonial with ID: ${testimonialId} not found.`);
    return res.status(404).json({ message: 'Testimonial not found' });
  }

  let { authorImage } = req.body;
  if (authorImage && authorImage.startsWith('data:image')) {
    // Optional: Upload to Cloudinary
    console.log('[INFO] Base64 author image detected on update. Stored directly in DB.');
  }

  const updatedTestimonial = await Testimonial.findByIdAndUpdate(
    testimonialId,
    { ...req.body, authorImage },
    { new: true }
  );

  console.log(`[DB] Successfully updated testimonial with ID: ${updatedTestimonial._id}`);
  res.status(200).json(updatedTestimonial);
});

// @desc    Delete a testimonial
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonialId = req.params.id;
  console.log(`[API] DELETE /api/v1/index/testimonials/${testimonialId} - Deleting testimonial...`);
  const testimonial = await Testimonial.findById(testimonialId);
  if (!testimonial) {
    console.warn(`[NOT_FOUND] Testimonial with ID: ${testimonialId} not found.`);
    return res.status(404).json({ message: 'Testimonial not found' });
  }
  await testimonial.deleteOne();
  console.log(`[DB] Successfully deleted testimonial with ID: ${testimonialId}`);
  res.status(200).json({ message: 'Testimonial removed' });
});

// --- Stat Controller Logic ---
// @desc    Get all stats
const getStats = asyncHandler(async (req, res) => {
  console.log(`[API] GET /api/v1/index/stats - Fetching all stats...`);
  const stats = await Stat.find({});
  console.log(`[DB] Found ${stats.length} stats.`);
  res.status(200).json(stats);
});

// @desc    Create a new stat
const createStat = asyncHandler(async (req, res) => {
  console.log(`[API] POST /api/v1/index/stats - Creating new stat...`);
  const { value, label } = req.body;
  if (!value || !label) {
    console.warn(`[VALIDATION_FAIL] Value and label are required.`);
    return res.status(400).json({ message: 'Value and label are required' });
  }
  const stat = await Stat.create({ value, label });
  console.log(`[DB] Created new stat with ID: ${stat._id}`);
  res.status(201).json(stat);
});

// @desc    Update a stat
const updateStat = asyncHandler(async (req, res) => {
  const statId = req.params.id;
  console.log(`[API] PUT /api/v1/index/stats/${statId} - Updating stat...`);
  const stat = await Stat.findById(statId);
  if (!stat) {
    console.warn(`[NOT_FOUND] Stat with ID: ${statId} not found.`);
    return res.status(404).json({ message: 'Stat not found' });
  }
  const updatedStat = await Stat.findByIdAndUpdate(statId, req.body, { new: true });
  console.log(`[DB] Successfully updated stat with ID: ${updatedStat._id}`);
  res.status(200).json(updatedStat);
});

// @desc    Delete a stat
const deleteStat = asyncHandler(async (req, res) => {
  const statId = req.params.id;
  console.log(`[API] DELETE /api/v1/index/stats/${statId} - Deleting stat...`);
  const stat = await Stat.findById(statId);
  if (!stat) {
    console.warn(`[NOT_FOUND] Stat with ID: ${statId} not found.`);
    return res.status(404).json({ message: 'Stat not found' });
  }
  await stat.deleteOne();
  console.log(`[DB] Successfully deleted stat with ID: ${statId}`);
  res.status(200).json({ message: 'Stat removed' });
});

// --- Footer Link Controller Logic ---
// @desc    Get all footer link columns
const getFooterLinks = asyncHandler(async (req, res) => {
  console.log(`[API] GET /api/v1/index/footer-links - Fetching all footer columns...`);
  const footerLinks = await FooterLinkColumn.find({});
  console.log(`[DB] Found ${footerLinks.length} footer columns.`);
  res.status(200).json(footerLinks);
});

// @desc    Create a new footer column
const createFooterColumn = asyncHandler(async (req, res) => {
  console.log(`[API] POST /api/v1/index/footer-links - Creating new footer column...`);
  const { columnTitle, links } = req.body;
  if (!columnTitle || !links) {
    console.warn(`[VALIDATION_FAIL] Column title and links are required.`);
    return res.status(400).json({ message: 'Column title and links are required' });
  }
  const column = await FooterLinkColumn.create({ columnTitle, links });
  console.log(`[DB] Created new footer column with ID: ${column._id}`);
  res.status(201).json(column);
});

// @desc    Update a footer column
const updateFooterColumn = asyncHandler(async (req, res) => {
  const columnId = req.params.id;
  console.log(`[API] PUT /api/v1/index/footer-links/${columnId} - Updating footer column...`);
  const column = await FooterLinkColumn.findById(columnId);
  if (!column) {
    console.warn(`[NOT_FOUND] Footer column with ID: ${columnId} not found.`);
    return res.status(404).json({ message: 'Footer column not found' });
  }
  const updatedColumn = await FooterLinkColumn.findByIdAndUpdate(columnId, req.body, { new: true });
  console.log(`[DB] Successfully updated footer column with ID: ${updatedColumn._id}`);
  res.status(200).json(updatedColumn);
});

// @desc    Delete a footer column
const deleteFooterColumn = asyncHandler(async (req, res) => {
  const columnId = req.params.id;
  console.log(`[API] DELETE /api/v1/index/footer-links/${columnId} - Deleting footer column...`);
  const column = await FooterLinkColumn.findById(columnId);
  if (!column) {
    console.warn(`[NOT_FOUND] Footer column with ID: ${columnId} not found.`);
    return res.status(404).json({ message: 'Footer column not found' });
  }
  await column.deleteOne();
  console.log(`[DB] Successfully deleted footer column with ID: ${columnId}`);
  res.status(200).json({ message: 'Footer column removed' });
});

// --- Site Info Controller Logic (UPDATED) ---

// @desc    Get site info
const getSiteInfo = asyncHandler(async (req, res) => {
  console.log(`[API] GET /api/v1/index/site-info - Fetching site info...`);
  const siteInfo = await SiteInfo.findOne();
  if (!siteInfo) {
    console.log(`[DB] No site info found. Returning default object.`);
    // UPDATED: Added socialLinks to default response
    return res.status(200).json({
      logoUrl: 'assets/images/logo/xarvislogo.png',
      footerDescription: 'Default description.',
      phone: 'Default phone',
      email: 'Default email',
      copyrightText: 'Default copyright',
      socialLinks: {
        facebook: '#',
        instagram: '#',
        linkedin: '#'
      }
    });
  }
  console.log(`[DB] Found site info. Document ID: ${siteInfo._id}`);
  res.status(200).json(siteInfo);
});

// @desc    Create or update site info
const createOrUpdateSiteInfo = asyncHandler(async (req, res) => {
  console.log(`[API] PUT /api/v1/index/site-info - Updating site info...`);
  console.log(`[DATA] Request body:`, req.body);

  // UPDATED: Destructure socialLinks
  let { logoUrl, footerDescription, phone, email, copyrightText, socialLinks } = req.body;

  if (logoUrl && logoUrl.startsWith('data:image')) {
    // Optional: Upload to Cloudinary
    console.log('[INFO] Base64 logo detected. Stored directly in DB.');
  }

  // UPDATED: Pass socialLinks to the update
  const updatedSiteInfo = await SiteInfo.findOneAndUpdate(
    {}, // find
    { logoUrl, footerDescription, phone, email, copyrightText, socialLinks }, // update
    { new: true, upsert: true, runValidators: true } // options
  );

  console.log(`[DB] Successfully created/updated site info. Document ID: ${updatedSiteInfo._id}`);
  console.log(`[VERIFIED] Logo URL: ${updatedSiteInfo.logoUrl}`);
  console.log(`[VERIFIED] Phone: ${updatedSiteInfo.phone}`);
  console.log(`[VERIFIED] Email: ${updatedSiteInfo.email}`);
  console.log(`[VERIFIED] Social (FB): ${updatedSiteInfo.socialLinks?.facebook}`);

  res.status(200).json(updatedSiteInfo);
});

// --- Export all controller functions ---
module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getStats,
  createStat,
  updateStat,
  deleteStat,
  getFooterLinks,
  createFooterColumn,
  updateFooterColumn,
  deleteFooterColumn,
  getSiteInfo,
  createOrUpdateSiteInfo,
};