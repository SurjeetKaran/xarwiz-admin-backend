// aboutContentController.js

const AboutContent = require('../models/about');

// ✅ Fixed unique document identifier based on updated model
const ABOUT_DOCUMENT_NAME = "ABOUT_PAGE";


/* ===========================================================
   CREATE: Initialize Single About Page (Once Only)
=========================================================== */
exports.createAboutContent = async (req, res) => {
    try {
        const existing = await AboutContent.findOne({ documentName: ABOUT_DOCUMENT_NAME });
        if (existing) {
            return res.status(409).json({
                message: "About Us content already exists. Please use PUT to update."
            });
        }

        req.body.documentName = ABOUT_DOCUMENT_NAME;
        const savedContent = await AboutContent.create(req.body);

        res.status(201).json({
            message: "About Us content initialized successfully.",
            data: savedContent
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create About Us content.",
            error: error.message
        });
    }
};


/* ===========================================================
   READ: Get Single Document
=========================================================== */
exports.getAboutContent = async (req, res) => {
    try {
        const content = await AboutContent.findOne({ documentName: ABOUT_DOCUMENT_NAME });

        if (!content) {
            return res.status(404).json({
                message: "No About Us content found. Please initialize using POST."
            });
        }

        res.status(200).json({ data: content });

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve About Us content.",
            error: error.message
        });
    }
};


/* ===========================================================
   UPDATE: Modify Existing Document
=========================================================== */
exports.updateAboutContent = async (req, res) => {
    try {
        delete req.body.documentName;

        const updatedContent = await AboutContent.findOneAndUpdate(
            { documentName: ABOUT_DOCUMENT_NAME },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedContent) {
            return res.status(404).json({
                message: "No existing content found. Please run POST to initialize first."
            });
        }

        res.status(200).json({
            message: "About Us content updated successfully.",
            data: updatedContent
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update About Us content.",
            error: error.message
        });
    }
};


/* ===========================================================
   DELETE (Optional — Admin Only)
=========================================================== */
exports.deleteAboutContent = async (req, res) => {
    try {
        const deleted = await AboutContent.findOneAndDelete({ documentName: ABOUT_DOCUMENT_NAME });

        if (!deleted) {
            return res.status(404).json({ message: "No content found to delete." });
        }

        res.status(200).json({
            message: "About Us content deleted successfully.",
            data: deleted
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete About Us content.",
            error: error.message
        });
    }
};
