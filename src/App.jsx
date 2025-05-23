import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Order from './pages/CourierOrders';
import Profile from './pages/Profile';
import Dashboart from './pages/CourierOrdersDashboard'

function App() {
  return (

      <Routes>
      <Route path="login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/orders" element={<Order />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dash" element={<Dashboart />} />
        </Route>
      </Routes>
  );
}

export default App;