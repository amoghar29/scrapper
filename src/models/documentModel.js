import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
    source: { type: String, required: true, index: true },
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    sections: [{
        title: String,
        content: String
    }],
    createdAt: { type: Date, default: Date.now }
});

// Create indexes for better query performance
DocumentSchema.index({ source: 1, url: 1 }, { unique: true });
DocumentSchema.index({ content: 'text', title: 'text' }); // Text index for searching

export default mongoose.model('Document', DocumentSchema);