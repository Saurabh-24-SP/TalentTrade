const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    uploadProfile,
    uploadServiceImages,
    uploadChatImage,
    deleteImage,
} = require('../services/uploadService');
const User = require('../models/User');
const Service = require('../models/Service');

// Extract correct URL from Cloudinary
const getFileUrl = (file) => {
    return file.secure_url || file.url || file.path || '';
};

const getPublicId = (file) => {
    return file.public_id || file.publicId || file.filename || '';
};

// POST /api/upload/avatar
router.post('/avatar', protect, (req, res) => {
    uploadProfile(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file was uploaded' });
        }
        try {
            console.log('req.file:', JSON.stringify(req.file, null, 2));

            const avatarUrl = getFileUrl(req.file);
            const avatarPublicId = getPublicId(req.file);

            console.log('Avatar URL:', avatarUrl);
            console.log('Public ID:', avatarPublicId);

            const user = await User.findById(req.user._id);

            // Delete old avatar
            if (user.avatarPublicId) {
                await deleteImage(user.avatarPublicId).catch(console.error);
            }

            user.avatar = avatarUrl;
            user.avatarPublicId = avatarPublicId;
            await user.save();

            res.json({
                success: true,
                avatar: avatarUrl,
                message: 'Profile picture updated ✅',
            });
        } catch (error) {
            console.error('Avatar save error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// POST /api/upload/service/:serviceId
router.post('/service/:serviceId', protect, (req, res) => {
    uploadServiceImages(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No file was uploaded' });
        }
        try {
            const service = await Service.findById(req.params.serviceId);
            if (!service) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }
            if (service.provider.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'You are not authorized' });
            }

            const newImages = req.files.map((file) => ({
                url: getFileUrl(file),
                publicId: getPublicId(file),
            }));

            service.images = [...(service.images || []), ...newImages].slice(0, 5);
            await service.save();

            res.json({
                success: true,
                images: service.images,
                message: `${req.files.length} image(s) uploaded ✅`,
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// DELETE /api/upload/service/:serviceId/image
router.delete('/service/:serviceId/image', protect, async (req, res) => {
    try {
        const { publicId } = req.body;
        const service = await Service.findById(req.params.serviceId);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        if (service.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized' });
        }

        await deleteImage(publicId);
        service.images = service.images.filter((img) => img.publicId !== publicId);
        await service.save();

        res.json({ success: true, images: service.images, message: 'Image deleted ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/upload/chat
router.post('/chat', protect, (req, res) => {
    uploadChatImage(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file was uploaded' });
        }
        res.json({
            success: true,
            url: getFileUrl(req.file),
            publicId: getPublicId(req.file),
            message: 'Image uploaded ✅',
        });
    });
});

module.exports = router;