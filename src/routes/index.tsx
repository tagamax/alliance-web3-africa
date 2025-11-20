import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Swap = lazy(() => import('../pages/Swap'));
const P2P = lazy(() => import('../pages/P2P'));
const Crown = lazy(() => import('../pages/Crown'));
const NFTImpact = lazy(() => import('../pages/NFTImpact'));
const DeFi = lazy(() => import('../pages/DeFi'));
const Governance = lazy(() => import('../pages/Governance'));
const CommodityIndex = lazy(() => import('../pages/CommodityIndex'));
const Entrepreneurs = lazy(() => import('../pages/Entrepreneurs'));
const MiningPools = lazy(() => import('../pages/MiningPools'));
const Notifications = lazy(() => import('../pages/Notifications'));
const Redistributions = lazy(() => import('../pages/Redistributions'));
const Deposit = lazy(() => import('../pages/Deposit'));
const Withdraw = lazy(() => import('../pages/Withdraw'));
const MineGame = lazy(() => import('../pages/MineGame'));
const Admin = lazy(() => import('../pages/Admin'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/swap',
    element: <Swap />,
  },
  {
    path: '/p2p',
    element: <P2P />,
  },
  {
    path: '/crown',
    element: <Crown />,
  },
  {
    path: '/nft',
    element: <NFTImpact />,
  },
  {
    path: '/defi',
    element: <DeFi />,
  },
  {
    path: '/governance',
    element: <Governance />,
  },
  {
    path: '/index',
    element: <CommodityIndex />,
  },
  {
    path: '/entrepreneurs',
    element: <Entrepreneurs />,
  },
  {
    path: '/mining',
    element: <MiningPools />,
  },
  {
    path: '/notifications',
    element: <Notifications />,
  },
  {
    path: '/redistributions',
    element: <Redistributions />,
  },
  {
    path: '/deposit',
    element: <Deposit />,
  },
  {
    path: '/withdraw',
    element: <Withdraw />,
  },
  {
    path: '/mine-game',
    element: <MineGame />,
  },
  {
    path: '/admin',
    element: <Admin />,
  },
];
