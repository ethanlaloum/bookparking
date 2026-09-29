import { useDispatch, useSelector } from 'react-redux';

import type { AppState } from '@front/store/AppState';

import type { MobileStore } from './createMobileStore';

// Comme sur le site, le seul fichier qui touche aux hooks bruts de react-redux.
export const useAppDispatch = useDispatch.withTypes<MobileStore['dispatch']>();
export const useAppSelector = useSelector.withTypes<AppState>();
