import express from 'express'

import {
  // Region controllers
  createRegion,
  getAllRegions,
  getRegionById,
  updateRegion,
  deleteRegion,

  // District controllers
  createDistrict,
  getAllDistricts,
  getDistrictById,
  updateDistrict,
  deleteDistrict,

  // County controllers
  createCounty,
  getAllCounties,
  getCountyById,
  updateCounty,
  deleteCounty,

  // Subcounty controllers
  createSubcounty,
  getAllSubcounties,
  getSubcountyById,
  updateSubcounty,
  deleteSubcounty,

  // Parish controllers
  createParish,
  getAllParishes,
  getParishById,
  updateParish,
  deleteParish,

  // Village controllers
  createVillage,
  getAllVillages,
  getVillageById,
  updateVillage,
  deleteVillage,

  // Utility controllers
  getLocationHierarchy,
} from '../controllers/locationController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// Public read-only routes for location hierarchy (used in space creation)
router.get('/regions', getAllRegions)
router.get('/districts', getAllDistricts)
router.get('/counties', getAllCounties)
router.get('/subcounties', getAllSubcounties)
router.get('/parishes', getAllParishes)
router.get('/villages', getAllVillages)

// Admin routes require authentication and admin/superadmin role
router.use(authenticateUser)
router.use(authorizeRoles('admin', 'superadmin'))

// Region routes
router.route('/regions').get(getAllRegions).post(createRegion)

router.route('/regions/:id').get(getRegionById).put(updateRegion).delete(deleteRegion)

// District routes
router.route('/districts').get(getAllDistricts).post(createDistrict)

router.route('/districts/:id').get(getDistrictById).put(updateDistrict).delete(deleteDistrict)

// County routes
router.route('/counties').get(getAllCounties).post(createCounty)

router.route('/counties/:id').get(getCountyById).put(updateCounty).delete(deleteCounty)

// Subcounty routes
router.route('/subcounties').get(getAllSubcounties).post(createSubcounty)

router.route('/subcounties/:id').get(getSubcountyById).put(updateSubcounty).delete(deleteSubcounty)

// Parish routes
router.route('/parishes').get(getAllParishes).post(createParish)

router.route('/parishes/:id').get(getParishById).put(updateParish).delete(deleteParish)

// Village routes
router.route('/villages').get(getAllVillages).post(createVillage)

router.route('/villages/:id').get(getVillageById).put(updateVillage).delete(deleteVillage)

// Utility routes
router.route('/hierarchy/:villageId').get(getLocationHierarchy)

export default router
