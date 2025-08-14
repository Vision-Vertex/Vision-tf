'use client';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1>Home</h1>
       {isAuthenticated ? (
        <button onClick={() => useAuthStore.getState().logout()}>Logout</button>
      ) : (
        <button onClick={() => router.push('/login')}>Login</button>
      )} 
    </div>
  );
}