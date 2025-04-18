import express from "express"
import {
  createSpace,
  getAllSpaces,
  getSpace,
  getMySpaces,
  updateSpace,
  deleteSpace,
  addSpaceImages,
  removeSpaceImage,
} from "../controllers/spaceController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.get("/", getAllSpaces)
router.get("/:id", getSpace)

// Protected routes
router.post("/", authenticateUser, createSpace)
router.get("/owner/my-spaces", authenticateUser, getMySpaces)
router.patch("/:id", authenticateUser, updateSpace)
router.delete("/:id", authenticateUser, deleteSpace)
router.post("/:id/images", authenticateUser, addSpaceImages)
router.delete("/:id/images", authenticateUser, removeSpaceImage)

export default router
