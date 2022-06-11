import { Router } from 'express'
const router = Router()

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})
// define the home page route
router.get('/', (req, res) => {
  res.send('all regions')
})

// define the about route
router.get('/:regionId', (req, res) => {
  res.send('per region')
})

export default router