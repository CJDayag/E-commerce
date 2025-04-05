import { useEffect } from 'react';
import { useTitle } from '../context/TitleContext';

export function usePageTitle(title: string) {
  const { setTitle } = useTitle();
  
  useEffect(() => {
    setTitle(title);
    
    // Reset title when component unmounts
    return () => {
      // You could reset to default title here if needed
    };
  }, [title, setTitle]);
}
