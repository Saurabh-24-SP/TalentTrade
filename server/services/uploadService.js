const cloudinary = require('cloudinary');
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Profile picture storage
const profileStorage = new cloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'TalentTrade-AI/profiles',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
});

// Service images storage
const serviceStorage = new cloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'TalentTrade-AI/services',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill' }],
});

// Chat images storage
const chatStorage = new cloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'TalentTrade-AI/chat',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
});

// Service resources storage (pdf/video)
const serviceContentStorage = new cloudinaryStorage({
    cloudinary: cloudinary,
    allowedFormats: ['pdf', 'mp4', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp'],
    params: {
        folder: 'TalentTrade-AI/service-content',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'mp4', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp'],
    },
});

// Multer upload handlers
const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
}).single('avatar');

const uploadServiceImages = multer({
    storage: serviceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
}).array('images', 5); // max 5 images

const uploadChatImage = multer({
    storage: chatStorage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
}).single('image');

const uploadServiceContent = multer({
    storage: serviceContentStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
        if (allowed) cb(null, true);
        else cb(new Error('Only video, PDF, or image files are allowed'), false);
    },
}).array('files', 10);

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

const deleteFile = async (publicId) => {
    const resourceTypes = ['image', 'video', 'raw'];
    let lastResult = null;
    for (const resource_type of resourceTypes) {
        try {
            const result = await cloudinary.uploader.destroy(publicId, { resource_type });
            lastResult = result;
            if (result?.result && result.result !== 'not found') {
                return result;
            }
        } catch (error) {
            // keep trying other resource types
            lastResult = lastResult || { result: 'error', error: error.message };
        }
    }
    return lastResult;
};

module.exports = {
    uploadProfile,
    uploadServiceImages,
    uploadChatImage,
    deleteImage,
    uploadServiceContent,
    deleteFile,
    cloudinary,
};