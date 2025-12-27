import { mock } from 'bun:test';

export const mockPush = mock(() => {});
export const mockReplace = mock(() => {});
export const mockBack = mock(() => {});
export const mockForward = mock(() => {});
export const mockRefresh = mock(() => {});
export const mockPrefetch = mock(() => {});

export const useRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
  prefetch: mockPrefetch,
});

let searchParamsStore = new URLSearchParams();

export const setMockSearchParams = (params: URLSearchParams) => {
  searchParamsStore = params;
};

export const useSearchParams = () => searchParamsStore;

export const usePathname = () => '/';

export const resetMocks = () => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockBack.mockClear();
  mockForward.mockClear();
  mockRefresh.mockClear();
  mockPrefetch.mockClear();
  searchParamsStore = new URLSearchParams();
};
