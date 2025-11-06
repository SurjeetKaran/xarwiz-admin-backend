const { GuestPosting, NicheEdit } = require("../models/serviceContent");

// ============================================================
// Helper: Get Model by type
// ============================================================
const getModel = (type) => {
  if (type === "guest-posting") return GuestPosting;
  if (type === "niche-edit") return NicheEdit;
  return null;
};

// ============================================================
// 1. CREATE
// ============================================================
exports.createContent = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: "Invalid content type." });

    const newDoc = new Model(req.body);
    const savedDoc = await newDoc.save();

    res.status(201).json({
      message: `✅ ${type} created successfully.`,
      data: savedDoc,
    });
  } catch (error) {
    console.error("❌ Error creating content:", error);
    res.status(500).json({
      message: "Failed to create content.",
      error: error.message,
    });
  }
};

// ============================================================
// 2. READ (Single)
// ============================================================
exports.getContent = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: "Invalid content type." });

    const doc = await Model.findOne({});
    if (!doc)
      return res.status(404).json({ message: `No ${type} content found.` });

    res.status(200).json({ data: doc });
  } catch (error) {
    console.error("❌ Error fetching content:", error);
    res.status(500).json({
      message: "Failed to fetch content.",
      error: error.message,
    });
  }
};

// ============================================================
// 3. READ (All)
// ============================================================
exports.getAllContent = async (req, res) => {
  try {
    const guest = await GuestPosting.find({});
    const niche = await NicheEdit.find({});
    res.status(200).json({
      message: "✅ All content fetched successfully.",
      data: {
        guestPosting: guest,
        nicheEdit: niche,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching all contents:", error);
    res.status(500).json({
      message: "Failed to fetch all contents.",
      error: error.message,
    });
  }
};

// ============================================================
// 4. UPDATE
// ============================================================
exports.updateContent = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: "Invalid content type." });

    const updatedDoc = await Model.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDoc)
      return res.status(404).json({ message: `No ${type} found to update.` });

    res.status(200).json({
      message: `✅ ${type} updated successfully.`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("❌ Error updating content:", error);
    res.status(500).json({
      message: "Failed to update content.",
      error: error.message,
    });
  }
};

// ============================================================
// 5. DELETE
// ============================================================
exports.deleteContent = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: "Invalid content type." });

    const deletedDoc = await Model.findOneAndDelete({});
    if (!deletedDoc)
      return res.status(404).json({ message: `No ${type} found to delete.` });

    res.status(200).json({
      message: `✅ ${type} deleted successfully.`,
      data: deletedDoc,
    });
  } catch (error) {
    console.error("❌ Error deleting content:", error);
    res.status(500).json({
      message: "Failed to delete content.",
      error: error.message,
    });
  }
};
