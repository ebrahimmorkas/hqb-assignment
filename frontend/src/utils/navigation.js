// React Router's navigate() only exists inside components. This lets
// non-component code (api/client.js, reacting to a 403/500 response) still
// redirect - App.jsx's NavigationBridge registers the real navigate function
// here once, at the root, inside the router.
let navigateFn = null;

export const setNavigator = (fn) => {
  navigateFn = fn;
};

export const redirectTo = (path) => {
  navigateFn?.(path);
};
