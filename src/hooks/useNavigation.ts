import { useNavigate } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();

  const goTo = (page: string) => {
    const path = page === 'dashboard' ? '/' : `/${page}`;
    navigate(path);
  };

  return { navigate: goTo };
}
