export interface CommonState {
  state: 'pending' | 'succeeded' | 'failed' | null;
  errorCode?: string;
}

export const initialCommonState: CommonState = { state: null };
