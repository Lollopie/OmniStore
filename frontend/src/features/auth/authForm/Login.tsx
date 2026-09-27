import AuthForm from './AuthForm.tsx';
import { useAuth } from '../authContext/';
// interface LoginProps {
// }
export default function Login() {
  const { setIsAuthenticated } = useAuth();
  return (
    <AuthForm
      title="Login"
      buttonText="Login"
      endpoint="/login"
      successMessage="Login successful!"
      onSuccess={() => setIsAuthenticated(true)}
      handleResponse={(data) => {
        localStorage.setItem('userWarehouses', JSON.stringify(data.warehouses));
        localStorage.setItem(
          'activeWarehouse',
          data.warehouses && data.warehouses[0] ? data.warehouses[0].warehouseId : '',
        );
        localStorage.setItem('activeRole', data.activeRole);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('orgId', data.orgId);
        localStorage.setItem('orgRole', data.orgRole);
      }}
    />
  );
}