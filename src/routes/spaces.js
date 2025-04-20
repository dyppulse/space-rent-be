import express from "express";
import {
  createSpace,
  getAllSpaces,
  getSpace,
  getMySpaces,
  updateSpace,
  deleteSpace,
  addSpaceImages,
  removeSpaceImage,
} from "../controllers/spaceController.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/spaces:
 *   get:
 *     summary: Get all public spaces
 *     tags: [Spaces]
 *     responses:
 *       200:
 *         description: A list of spaces
 */
router.get("/", getAllSpaces);

/**
 * @swagger
 * /api/spaces/{id}:
 *   get:
 *     summary: Get a space by ID
 *     tags: [Spaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The space ID
 *     responses:
 *       200:
 *         description: A space object
 */
router.get("/:id", getSpace);

/**
 * @swagger
 * /api/spaces:
 *   post:
 *     summary: Create a new space
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, location, price]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Space created
 */
router.post("/", authenticateUser, createSpace);

/**
 * @swagger
 * /api/spaces/owner/my-spaces:
 *   get:
 *     summary: Get spaces created by the current user
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's spaces
 */
router.get("/owner/my-spaces", authenticateUser, getMySpaces);

/**
 * @swagger
 * /api/spaces/{id}:
 *   patch:
 *     summary: Update a space by ID
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Space ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Space updated
 */
router.patch("/:id", authenticateUser, updateSpace);

/**
 * @swagger
 * /api/spaces/{id}:
 *   delete:
 *     summary: Delete a space
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Space ID
 *     responses:
 *       200:
 *         description: Space deleted
 */
router.delete("/:id", authenticateUser, deleteSpace);

/**
 * @swagger
 * /api/spaces/{id}/images:
 *   post:
 *     summary: Add images to a space
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Space ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded
 */
router.post("/:id/images", authenticateUser, addSpaceImages);

/**
 * @swagger
 * /api/spaces/{id}/images:
 *   delete:
 *     summary: Remove images from a space
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Space ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images removed
 */
router.delete("/:id/images", authenticateUser, removeSpaceImage);

export default router;
