import express from 'express'

import {
  createLocationRef,
  deleteLocationRef,
  listLocationRefs,
  updateLocationRef,
} from '../controllers/locationRefController.js'
import {
  createTaxonomy,
  deleteTaxonomy,
  listTaxonomies,
  updateTaxonomy,
} from '../controllers/taxonomyController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateUser, authorizeRoles('admin'))

// Taxonomies (space types, amenities)
router.get('/taxonomies', listTaxonomies)
router.post('/taxonomies', createTaxonomy)
router.patch('/taxonomies/:id', updateTaxonomy)
router.delete('/taxonomies/:id', deleteTaxonomy)

export default router

// Locations reference (optional dataset)
router.get('/locations', listLocationRefs)
router.post('/locations', createLocationRef)
router.patch('/locations/:id', updateLocationRef)
router.delete('/locations/:id', deleteLocationRef)
