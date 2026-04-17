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

module.exports = {
    uploadProfile,
    uploadServiceImages,
    uploadChatImage,
    deleteImage,
    cloudinary,
};