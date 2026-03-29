import { RouterProvider } from 'react-router-dom'
import router from './routes/routes.js'

export default function App() {
  return <RouterProvider router={router} />
}
